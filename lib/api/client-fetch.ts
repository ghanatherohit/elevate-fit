import {
  toUserMessage,
  USER_ERRORS,
  userMessageFromResponse,
} from "@/lib/errors/user-facing";

export type JsonFetchResult<T> =
  | { ok: true; status: number; data: T; message: null }
  | { ok: false; status: number; data: T | null; message: string };

/**
 * Client fetch that always yields safe user-facing failure copy.
 * Does not throw for HTTP errors — check `ok` / `message`.
 */
export async function fetchJson<T = unknown>(
  input: RequestInfo | URL,
  init?: RequestInit,
  fallback: string = USER_ERRORS.generic,
): Promise<JsonFetchResult<T>> {
  let response: Response;
  try {
    response = await fetch(input, init);
  } catch (error) {
    return {
      ok: false,
      status: 0,
      data: null,
      message: toUserMessage(error, USER_ERRORS.network),
    };
  }

  let data: T | null = null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    try {
      data = (await response.clone().json()) as T;
    } catch {
      data = null;
    }
  }

  if (response.ok) {
    return { ok: true, status: response.status, data: data as T, message: null };
  }

  return {
    ok: false,
    status: response.status,
    data,
    message: await userMessageFromResponse(response, fallback),
  };
}
