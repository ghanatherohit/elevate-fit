export type PasswordStrength = "weak" | "medium" | "strong";

export type PasswordStrengthResult = {
  level: PasswordStrength;
  label: string;
  /** 0–3 steps for the meter (Weak / Medium / Strong). */
  score: number;
  checks: {
    length: boolean;
    lower: boolean;
    upper: boolean;
    number: boolean;
    special: boolean;
  };
};

/**
 * Industry-style strength (Weak / Medium / Strong).
 * Strong = 8+ chars with lowercase, uppercase, number, and symbol.
 */
export function getPasswordStrength(password: string): PasswordStrengthResult {
  const checks = {
    length: password.length >= 8,
    lower: /[a-z]/.test(password),
    upper: /[A-Z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const passed = Object.values(checks).filter(Boolean).length;

  if (!password) {
    return {
      level: "weak",
      label: "Weak",
      score: 0,
      checks,
    };
  }

  if (passed >= 5) {
    return {
      level: "strong",
      label: "Strong",
      score: 3,
      checks,
    };
  }

  if (checks.length && passed >= 3) {
    return {
      level: "medium",
      label: "Medium",
      score: 2,
      checks,
    };
  }

  return {
    level: "weak",
    label: "Weak",
    score: 1,
    checks,
  };
}

export function isPasswordStrong(password: string) {
  return getPasswordStrength(password).level === "strong";
}

/** Medium or Strong — enough for signup. */
export function isPasswordAcceptable(password: string) {
  const level = getPasswordStrength(password).level;
  return level === "medium" || level === "strong";
}

export function getPasswordRequirementHint() {
  return "Use 8+ characters with mixed letter cases (add a number or symbol for Strong).";
}
