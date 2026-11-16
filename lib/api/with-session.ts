import { requireSession } from "@/lib/auth/session";
import type { SessionPayload } from "@/lib/auth/jwt";
import { apiUnauthorized } from "@/lib/api/response";

export async function withSession() {
  const session = await requireSession();
  if (!session) {
    return {
      session: null as SessionPayload | null,
      error: apiUnauthorized(),
    };
  }
  return { session, error: null };
}
