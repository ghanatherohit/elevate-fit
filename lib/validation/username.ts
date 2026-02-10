const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function isUsernameValid(value: string) {
  return USERNAME_REGEX.test(value);
}

export function getUsernameHint() {
  return "Use 3-20 chars: lowercase letters, numbers, underscore.";
}
