import { jwtVerify } from "jose";
import type { SessionPayload } from "@/lib/auth/jwt";

/**
 * Edge-safe session verification for proxy/middleware.
 * Uses jose (Web Crypto) instead of jsonwebtoken (Node crypto).
 */
export async function verifySessionEdge(
  token: string,
): Promise<SessionPayload | null> {
  const secret = process.env.JWT_SECRET;
  if (!secret || !token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
      {
        algorithms: ["HS256"],
        issuer: "elevate-fit",
        audience: "elevate-fit",
      },
    );

    if (typeof payload.uid !== "string" || !payload.uid) {
      return null;
    }

    return {
      uid: payload.uid,
      username:
        typeof payload.username === "string" ? payload.username : null,
      email: typeof payload.email === "string" ? payload.email : null,
      name: typeof payload.name === "string" ? payload.name : null,
      photoURL:
        typeof payload.photoURL === "string" ? payload.photoURL : null,
      sessionVersion:
        typeof payload.sessionVersion === "number"
          ? payload.sessionVersion
          : 1,
    };
  } catch {
    return null;
  }
}
