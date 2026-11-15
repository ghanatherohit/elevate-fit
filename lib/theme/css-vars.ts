"use client";

import { useSyncExternalStore } from "react";
import { UI_STYLE_STORAGE_KEY } from "@/lib/theme/styles";

export type ThemeCssVars = {
  accent: string;
  accent2: string;
  chartGrid: string;
  chartTooltip: string;
  chartMuted: string;
  border: string;
  meshBg: string;
  meshAccent: string;
  meshAccent2: string;
  meshLine: string;
};

const FALLBACK: ThemeCssVars = {
  accent: "#62d2ff",
  accent2: "#7c6cff",
  chartGrid: "rgba(255,255,255,0.08)",
  chartTooltip: "rgba(12,12,12,0.92)",
  chartMuted: "rgba(255,255,255,0.12)",
  border: "rgba(255,255,255,0.08)",
  meshBg: "#0d111c",
  meshAccent: "#6bd0ff",
  meshAccent2: "#9ab2ff",
  meshLine: "#d7d7d7",
};

let cachedVars: ThemeCssVars = FALLBACK;

function readVar(name: string, fallback: string) {
  if (typeof window === "undefined") {
    return fallback;
  }
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

function varsEqual(a: ThemeCssVars, b: ThemeCssVars) {
  return (
    a.accent === b.accent &&
    a.accent2 === b.accent2 &&
    a.chartGrid === b.chartGrid &&
    a.chartTooltip === b.chartTooltip &&
    a.chartMuted === b.chartMuted &&
    a.border === b.border &&
    a.meshBg === b.meshBg &&
    a.meshAccent === b.meshAccent &&
    a.meshAccent2 === b.meshAccent2 &&
    a.meshLine === b.meshLine
  );
}

export function readThemeCssVars(): ThemeCssVars {
  const next: ThemeCssVars = {
    accent: readVar("--accent", FALLBACK.accent),
    accent2: readVar("--accent-2", FALLBACK.accent2),
    chartGrid: readVar("--chart-grid", FALLBACK.chartGrid),
    chartTooltip: readVar("--chart-tooltip", FALLBACK.chartTooltip),
    chartMuted: readVar("--chart-muted", FALLBACK.chartMuted),
    border: readVar("--border", FALLBACK.border),
    meshBg: readVar("--mesh-bg", FALLBACK.meshBg),
    meshAccent: readVar("--mesh-accent", FALLBACK.meshAccent),
    meshAccent2: readVar("--mesh-accent-2", FALLBACK.meshAccent2),
    meshLine: readVar("--mesh-line", FALLBACK.meshLine),
  };

  // useSyncExternalStore requires a stable snapshot reference when values are unchanged.
  if (varsEqual(cachedVars, next)) {
    return cachedVars;
  }
  cachedVars = next;
  return cachedVars;
}

function subscribe(onChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === UI_STYLE_STORAGE_KEY || event.key === "ef-theme") {
      onChange();
    }
  };
  const onTheme = () => onChange();
  window.addEventListener("storage", onStorage);
  window.addEventListener("ef-ui-style-change", onTheme);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("ef-ui-style-change", onTheme);
  };
}

export function useThemeCssVars(): ThemeCssVars {
  return useSyncExternalStore(subscribe, readThemeCssVars, () => FALLBACK);
}
