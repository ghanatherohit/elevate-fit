"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import {
  DEFAULT_UI_STYLE,
  UI_STYLE_STORAGE_KEY,
  getUiStyleMeta,
  isUiStyleId,
  resolveStoredUiStyle,
  type UiStyleId,
} from "@/lib/theme/styles";

type ThemeContextValue = {
  styleId: UiStyleId;
  setStyle: (styleId: UiStyleId) => void;
  /** @deprecated use styleId */
  theme: "light" | "dark";
  /** @deprecated use setStyle */
  setTheme: (theme: "light" | "dark") => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);
const listeners = new Set<() => void>();
let themeTransitionTimer: number | null = null;

function emit() {
  listeners.forEach((listener) => listener());
}

function applyStyle(styleId: UiStyleId) {
  if (typeof document === "undefined") {
    return;
  }
  const root = document.documentElement;
  root.dataset.theme = styleId;
  root.classList.remove("light");
  root.classList.add("theme-transition");

  if (themeTransitionTimer !== null) {
    window.clearTimeout(themeTransitionTimer);
  }
  // Match globals.css theme transition duration (~0.65s) then stop animating everything.
  themeTransitionTimer = window.setTimeout(() => {
    root.classList.remove("theme-transition");
    themeTransitionTimer = null;
  }, 700);

  const bg = getComputedStyle(root).getPropertyValue("--bg").trim();
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta && bg) {
    meta.setAttribute("content", bg);
  }
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  const handler = (event: StorageEvent) => {
    if (
      event.key === UI_STYLE_STORAGE_KEY ||
      event.key === "ef-theme"
    ) {
      onStoreChange();
    }
  };
  const onTheme = () => onStoreChange();
  window.addEventListener("storage", handler);
  window.addEventListener("ef-ui-style-change", onTheme);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("storage", handler);
    window.removeEventListener("ef-ui-style-change", onTheme);
  };
}

function getSnapshot(): UiStyleId {
  return resolveStoredUiStyle();
}

function getServerSnapshot(): UiStyleId {
  return DEFAULT_UI_STYLE;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return ctx;
}

export function useUiStyle() {
  const ctx = useTheme();
  return {
    styleId: ctx.styleId,
    setStyle: ctx.setStyle,
    meta: getUiStyleMeta(ctx.styleId),
  };
}

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const styleId = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  useEffect(() => {
    applyStyle(styleId);
  }, [styleId]);

  const setStyle = useCallback((next: UiStyleId) => {
    if (!isUiStyleId(next)) {
      return;
    }
    localStorage.setItem(UI_STYLE_STORAGE_KEY, next);
    applyStyle(next);
    window.dispatchEvent(new Event("ef-ui-style-change"));
    emit();
  }, []);

  const setTheme = useCallback(
    (theme: "light" | "dark") => {
      setStyle(theme === "light" ? "ethereal" : "glassmorphism");
    },
    [setStyle],
  );

  const toggleTheme = useCallback(() => {
    const lightLike = ["ethereal", "minimalism", "swiss", "neumorphism", "wabi-sabi"];
    const isLight = lightLike.includes(styleId);
    setStyle(isLight ? "glassmorphism" : "ethereal");
  }, [setStyle, styleId]);

  const value = useMemo(
    () => ({
      styleId,
      setStyle,
      theme: (["ethereal", "minimalism", "swiss", "neumorphism", "wabi-sabi"].includes(
        styleId,
      )
        ? "light"
        : "dark") as "light" | "dark",
      setTheme,
      toggleTheme,
    }),
    [styleId, setStyle, setTheme, toggleTheme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
