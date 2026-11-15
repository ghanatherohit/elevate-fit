import { timingSafeEqual } from "crypto";

export function timingSafeEqualString(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

export function authorizeBearerSecret(
  request: Request,
  secret: string | undefined,
) {
  if (!secret) {
    return false;
  }
  const header = request.headers.get("authorization") || "";
  const expected = `Bearer ${secret}`;
  return timingSafeEqualString(header, expected);
}
