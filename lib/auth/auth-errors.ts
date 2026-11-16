import { NextResponse } from "next/server";
import { USER_ERRORS } from "@/lib/errors/user-facing";

type AuthFailOptions = {
  fallback?: string;
  status?: number;
};

function firebaseCode(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "";
  }
  if (
    "errorInfo" in error &&
    error.errorInfo &&
    typeof error.errorInfo === "object" &&
    "code" in error.errorInfo &&
    typeof (error.errorInfo as { code?: unknown }).code === "string"
  ) {
    return (error.errorInfo as { code: string }).code;
  }
  if ("code" in error && typeof (error as { code?: unknown }).code === "string") {
    return (error as { code: string }).code;
  }
  return "";
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "";
}

/**
 * Map auth failures to safe client responses.
 * Real causes stay in server logs only — never env/config details.
 */
export function authFailureResponse(
  error: unknown,
  options: AuthFailOptions = {},
) {
  const fallback = options.fallback ?? USER_ERRORS.signInFailed;
  const code = firebaseCode(error);
  const message = errorMessage(error);

  if (
    code === "auth/id-token-expired" ||
    code === "auth/argument-error" ||
    code === "auth/invalid-id-token" ||
    message.includes("Decoding Firebase ID token failed") ||
    message.includes("Firebase ID token has expired")
  ) {
    return NextResponse.json(
      { error: USER_ERRORS.signInExpired },
      { status: 401 },
    );
  }

  if (
    message.includes("FIREBASE_SERVICE_ACCOUNT") ||
    message.includes("Firebase Admin is not configured") ||
    message.includes("FIREBASE_ADMIN_") ||
    message.includes("Missing Firebase API key") ||
    message.includes("Missing JWT_SECRET") ||
    message.includes("MONGODB_URI") ||
    message.includes("ECONNREFUSED") ||
    message.includes("MongoNetworkError") ||
    message.includes("MongoServerSelectionError") ||
    message.includes("Unable to create user session") ||
    /vapid/i.test(message) ||
    /RESEND/i.test(message)
  ) {
    return NextResponse.json(
      { error: USER_ERRORS.unavailable },
      { status: 503 },
    );
  }

  return NextResponse.json(
    { error: fallback },
    { status: options.status ?? 500 },
  );
}
