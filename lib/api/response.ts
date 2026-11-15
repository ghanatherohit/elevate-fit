import { NextResponse } from "next/server";

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
