import { cookies } from "next/headers";
import { verifySession } from "./jwt";

export async function requireSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("ef_session")?.value;

  if (!token) {
    return null;
  }

  try {
    return verifySession(token);
  } catch {
    return null;
  }
}
