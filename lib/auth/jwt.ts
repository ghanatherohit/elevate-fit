import jwt from "jsonwebtoken";

export type SessionPayload = {
  uid: string;
  username?: string | null;
  email?: string | null;
  name?: string | null;
  photoURL?: string | null;
  sessionVersion?: number;
};

function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Missing JWT_SECRET in environment");
  }
  return secret;
}

/** Short-lived access token; pair with sessionVersion for revocation. */
export function signSession(payload: SessionPayload) {
  return jwt.sign(payload, getJWTSecret(), {
    expiresIn: "24h",
    algorithm: "HS256",
    issuer: "elevate-fit",
    audience: "elevate-fit",
  });
}

export function verifySession(token: string) {
  return jwt.verify(token, getJWTSecret(), {
    algorithms: ["HS256"],
    issuer: "elevate-fit",
    audience: "elevate-fit",
  }) as SessionPayload;
}
