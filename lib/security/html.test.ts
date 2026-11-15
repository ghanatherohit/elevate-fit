import { describe, expect, it } from "vitest";
import { escapeHtml } from "@/lib/security/html";

describe("escapeHtml", () => {
  it("escapes angle brackets and quotes", () => {
    expect(escapeHtml(`<img src=x onerror="alert(1)">`)).toBe(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;",
    );
  });
});
