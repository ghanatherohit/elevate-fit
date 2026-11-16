import { NextResponse } from "next/server";
import { USER_ERRORS } from "@/lib/errors/user-facing";

export function apiOk<T extends Record<string, unknown>>(
  data: T,
  init?: ResponseInit,
) {
  return NextResponse.json(data, init);
}

export function apiError(
  error: string,
  status: number,
  extras?: Record<string, unknown>,
) {
  return NextResponse.json({ error, ...extras }, { status });
}

/** Log the real error; return only user-safe copy. */
export function apiUnavailable(
  logLabel: string,
  error: unknown,
  userMessage: string = USER_ERRORS.unavailable,
) {
  console.error(logLabel, error);
  return NextResponse.json({ error: userMessage }, { status: 503 });
}

export function apiUnauthorized(
  userMessage: string = USER_ERRORS.unauthorized,
) {
  return NextResponse.json({ error: userMessage }, { status: 401 });
}

export function apiNotFound(
  userMessage: string = USER_ERRORS.notFound,
) {
  return NextResponse.json({ error: userMessage }, { status: 404 });
}

/** Catch unexpected failures and return a safe 503. */
export async function withApiHandler(
  logLabel: string,
  handler: () => Promise<Response>,
) {
  try {
    return await handler();
  } catch (error) {
    return apiUnavailable(logLabel, error);
  }
}
