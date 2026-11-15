import { describe, expect, it } from "vitest";
import {
  getPasswordStrength,
  isPasswordAcceptable,
  isPasswordStrong,
} from "@/lib/validation/password";

describe("password strength", () => {
  it("rejects empty and short passwords as weak", () => {
    expect(getPasswordStrength("").level).toBe("weak");
    expect(getPasswordStrength("Ab1").level).toBe("weak");
    expect(isPasswordAcceptable("Ab1")).toBe(false);
  });

  it("accepts medium passwords for signup", () => {
    expect(getPasswordStrength("Abcdefgh").level).toBe("medium");
    expect(isPasswordAcceptable("Abcdefgh")).toBe(true);
    expect(getPasswordStrength("abcdefg1").level).toBe("medium");
    expect(isPasswordAcceptable("abcdefg1")).toBe(true);
  });

  it("marks full mix as strong", () => {
    expect(getPasswordStrength("Abcdef1!").level).toBe("strong");
    expect(isPasswordStrong("Abcdef1!")).toBe(true);
    expect(isPasswordAcceptable("Abcdef1!")).toBe(true);
  });
});
