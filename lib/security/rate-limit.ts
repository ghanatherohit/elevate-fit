import { connectToDatabase } from "@/lib/db/mongoose";
import mongoose, { Schema } from "mongoose";

type RateLimitDocument = {
  key: string;
  count: number;
  resetAt: Date;
};

const RateLimitSchema = new Schema<RateLimitDocument>(
  {
    key: { type: String, required: true, unique: true },
    count: { type: Number, required: true, default: 0 },
    resetAt: { type: Date, required: true },
  },
  { timestamps: false },
);

RateLimitSchema.index({ resetAt: 1 }, { expireAfterSeconds: 0 });

const RateLimitModel =
  mongoose.models.RateLimit ||
  mongoose.model<RateLimitDocument>("RateLimit", RateLimitSchema);

const memoryHits = new Map<string, { count: number; resetAt: number }>();

export function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}

async function allowWithUpstash(key: string, limit: number, windowMs: number) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    return null;
  }

  const windowSec = Math.ceil(windowMs / 1000);
  const redisKey = `rl:${key}`;

  const incrRes = await fetch(`${url}/incr/${encodeURIComponent(redisKey)}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!incrRes.ok) {
    return null;
  }
  const incrJson = (await incrRes.json()) as { result?: number };
  const count = incrJson.result ?? 1;

  if (count === 1) {
    await fetch(`${url}/expire/${encodeURIComponent(redisKey)}/${windowSec}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  return count <= limit;
}

async function allowWithMongo(key: string, limit: number, windowMs: number) {
  await connectToDatabase();
  const now = new Date();
  const existing = await RateLimitModel.findOne({ key });

  if (!existing || existing.resetAt <= now) {
    await RateLimitModel.findOneAndUpdate(
      { key },
      {
        $set: { count: 1, resetAt: new Date(now.getTime() + windowMs) },
      },
      { upsert: true },
    );
    return true;
  }

  if (existing.count >= limit) {
    return false;
  }

  await RateLimitModel.updateOne({ key }, { $inc: { count: 1 } });
  return true;
}

function allowInMemory(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = memoryHits.get(key);
  if (!current || current.resetAt <= now) {
    memoryHits.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= limit) {
    return false;
  }
  current.count += 1;
  return true;
}

/**
 * Distributed rate limit: Upstash → Mongo → in-memory fallback.
 */
export async function allowRequest(params: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  try {
    const upstash = await allowWithUpstash(
      params.key,
      params.limit,
      params.windowMs,
    );
    if (upstash !== null) {
      return upstash;
    }
  } catch {
    // fall through
  }

  try {
    return await allowWithMongo(params.key, params.limit, params.windowMs);
  } catch {
    return allowInMemory(params.key, params.limit, params.windowMs);
  }
}
