import { requireSession } from "@/lib/auth/session";
import type { SessionPayload } from "@/lib/auth/jwt";
import { apiError } from "@/lib/api/response";

export async function withSession() {
  const session = await requireSession();
  if (!session) {
    return { session: null as SessionPayload | null, error: apiError("Unauthorized", 401) };
  }
  return { session, error: null };
}
