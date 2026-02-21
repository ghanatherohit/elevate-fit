import jwt from "jsonwebtoken";

export type SessionPayload = {
  uid: string;
  username?: string | null;
  email?: string | null;
  name?: string | null;
  photoURL?: string | null;
};

function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Missing JWT_SECRET in environment");
  }
  return secret;
}

export function signSession(payload: SessionPayload) {
  return jwt.sign(payload, getJWTSecret(), { expiresIn: "7d" });
}

export function verifySession(token: string) {
  return jwt.verify(token, getJWTSecret()) as SessionPayload;
}
