import jwt from "jsonwebtoken";

export type SessionPayload = {
  uid: string;
  username?: string | null;
  email?: string | null;
  name?: string | null;
  photoURL?: string | null;
};

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("Missing JWT_SECRET in environment");
}

export function signSession(payload: SessionPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifySession(token: string) {
  return jwt.verify(token, JWT_SECRET) as SessionPayload;
}
