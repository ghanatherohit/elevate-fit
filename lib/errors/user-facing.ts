/**
 * User-facing copy only. Server logs keep the real cause for engineers.
 * Never put env var names, stack traces, or config hints in these strings.
 */

export const USER_ERRORS = {
  generic:
    "Something went wrong on our side. Please try again in a moment.",
  unavailable:
    "Our servers are having trouble right now. Please try again shortly.",
  network:
    "We couldn’t reach the server. Check your connection and try again.",
  unauthorized: "Please sign in again to continue.",
  rateLimit: "Too many attempts. Wait a moment and try again.",
  notFound: "We couldn’t find what you’re looking for.",
  userNotFound:
    "We couldn’t find your account. Please sign in again.",
  invalidPayload:
    "That request didn’t look right. Please check and try again.",
  signInFailed: "We couldn’t sign you in. Please try again.",
  signInExpired: "Your sign-in expired. Please try again.",
  sessionFailed: "We couldn’t finish signing you in. Please try again.",
  registerFailed: "We couldn’t create your account. Please try again.",
  resetFailed: "We couldn’t send a reset email right now. Please try again.",
  usernameCheckFailed:
    "We couldn’t check that username right now. Please try again.",
  saveFailed: "We couldn’t save your changes. Please try again.",
  loadFailed: "We couldn’t load this right now. Please try again.",
  invalidCredentials: "Email/username or password is incorrect.",
  popupClosed: "Sign-in was cancelled. You can try again anytime.",
  popupBlocked:
    "Your browser blocked the sign-in window. Allow popups and try again.",
  emailInUse: "That email is already registered.",
  usernameInUse: "That username is already taken.",
  usernameLocked: "Username can’t be changed after registration.",
  emailConflict:
    "That email is already registered with a different sign-in method. Try email and password, or the Google account you used before.",
  weakPassword: "Choose a stronger password (8+ characters, mixed case).",
  dietNotConfigured: "Set up your diet profile to continue.",
  dietLoadFailed: "We couldn’t load your diet plan. Please try again.",
  dietSaveFailed:
    "Saved on this device. We couldn’t sync to the server yet.",
  pushUnavailable:
    "Push notifications aren’t available right now. Please try again later.",
  pushUnsupported: "Push isn’t supported in this browser.",
  testFailed: "We couldn’t send a test notification. Please try again.",
  reminderFailed: "We couldn’t update that reminder. Please try again.",
  pageCrash: "Something went wrong on this page. You can try again.",
} as const;

export type UserErrorKey = keyof typeof USER_ERRORS;

const TECHNICAL_PATTERNS = [
  /firebase[_ ]?service[_ ]?account/i,
  /firebase[_ ]?admin/i,
  /firebase api key/i,
  /jwt_secret/i,
  /mongodb/i,
  /database unavailable/i,
  /\.env/i,
  /misconfigured/i,
  /not configured/i,
  /econnrefused/i,
  /mongo(network|server)/i,
  /stack trace/i,
  /at\s+\S+\s+\(/i,
  /internal server error/i,
  /prisma/i,
  /ENOTFOUND/i,
  /ECONNRESET/i,
  /^unauthorized$/i,
  /^user not found$/i,
  /^not found$/i,
  /^error:/i,
  /status code/i,
  /failed to fetch/i,
  /networkerror/i,
  /auth\/[a-z0-9-]+/i,
  /^session failed$/i,
  /^login failed$/i,
  /^failed to /i,
  /^missing\b/i,
  /idtoken/i,
  /expected .+ received/i,
  /invalid (enum|type|literal|input|json)/i,
  /yyyy-mm-dd/i,
  /\bstartDate\b|\bendDate\b/i,
  /fields to update/i,
  /vapid/i,
  /resend/i,
  /service account/i,
  /unable to create user session/i,
];

/** True when a string looks like an engineer/config leak. */
export function looksTechnical(message: string) {
  const trimmed = message.trim();
  if (!trimmed) {
    return true;
  }
  if (trimmed.length > 180) {
    return true;
  }
  return TECHNICAL_PATTERNS.some((pattern) => pattern.test(trimmed));
}

/**
 * Pick a safe message for the UI.
 * Allows known product copy; replaces technical/config text.
 */
export function toUserMessage(
  input: unknown,
  fallback: string = USER_ERRORS.generic,
): string {
  if (typeof input === "string" && input.trim() && !looksTechnical(input)) {
    return input.trim();
  }

  if (input instanceof Error && input.message.trim()) {
    if (!looksTechnical(input.message)) {
      return input.message.trim();
    }
  }

  if (input && typeof input === "object" && "message" in input) {
    const message = (input as { message?: unknown }).message;
    if (typeof message === "string" && message.trim() && !looksTechnical(message)) {
      return message.trim();
    }
  }

  return fallback;
}

/** Map HTTP status → default user copy for API failures. */
export function messageForStatus(
  status: number,
  fallback: string = USER_ERRORS.generic,
) {
  if (status === 401) {
    return USER_ERRORS.unauthorized;
  }
  if (status === 404) {
    return USER_ERRORS.notFound;
  }
  if (status === 429) {
    return USER_ERRORS.rateLimit;
  }
  if (status >= 500) {
    return USER_ERRORS.unavailable;
  }
  return fallback;
}

/**
 * Read JSON `{ error }` / `{ message }` from a failed Response and
 * return copy that is safe to show.
 */
export async function userMessageFromResponse(
  response: Response,
  fallback: string = USER_ERRORS.generic,
): Promise<string> {
  if (response.status === 429) {
    return USER_ERRORS.rateLimit;
  }
  if (response.status === 401) {
    return USER_ERRORS.unauthorized;
  }
  if (response.status === 404) {
    return USER_ERRORS.notFound;
  }

  try {
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return messageForStatus(response.status, fallback);
    }
    const body = (await response.json()) as {
      error?: unknown;
      message?: unknown;
    };
    const candidate =
      (typeof body.error === "string" && body.error) ||
      (typeof body.message === "string" && body.message) ||
      "";
    return toUserMessage(candidate, messageForStatus(response.status, fallback));
  } catch {
    return messageForStatus(response.status, fallback);
  }
}
