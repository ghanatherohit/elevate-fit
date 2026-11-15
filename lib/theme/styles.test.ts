import { describe, expect, it } from "vitest";
import {
  DEFAULT_UI_STYLE,
  UI_STYLE_IDS,
  UI_STYLES,
  isUiStyleId,
  resolveStoredUiStyle,
} from "@/lib/theme/styles";

describe("ui style catalog", () => {
  it("exposes exactly 29 unique style ids", () => {
    expect(UI_STYLE_IDS).toHaveLength(29);
    expect(new Set(UI_STYLE_IDS).size).toBe(29);
    expect(UI_STYLES).toHaveLength(29);
  });

  it("includes meta for every id", () => {
    for (const id of UI_STYLE_IDS) {
      const meta = UI_STYLES.find((style) => style.id === id);
      expect(meta).toBeTruthy();
      expect(meta?.label.length).toBeGreaterThan(0);
      expect(meta?.description.length).toBeGreaterThan(0);
      expect(meta?.preview.bg).toMatch(/^#/);
    }
  });

  it("validates style ids", () => {
    expect(isUiStyleId("glassmorphism")).toBe(true);
    expect(isUiStyleId("neo-brutalism")).toBe(true);
    expect(isUiStyleId("not-a-style")).toBe(false);
    expect(isUiStyleId(undefined)).toBe(false);
  });

  it("defaults to glassmorphism without storage", () => {
    expect(DEFAULT_UI_STYLE).toBe("glassmorphism");
    expect(resolveStoredUiStyle()).toBe("glassmorphism");
  });
});
