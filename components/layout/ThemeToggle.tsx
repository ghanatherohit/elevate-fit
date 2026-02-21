"use client";

import { useEffect, useState } from "react";

const storageKey = "ef-theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") {
      return "dark";
    }
    const stored = localStorage.getItem(storageKey);
    return stored === "light" ? "light" : "dark";
  });

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("light", theme === "light");
    }
  }, [theme]);

  const handleToggle = () => {
    const next = theme === "light" ? "dark" : "light";
    localStorage.setItem(storageKey, next);
    setTheme(next);
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("light", next === "light");
    }
  };

  return (
    <button
      className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-left text-sm"
      onClick={handleToggle}
    >
      <span className="text-foreground">Theme</span>
      <span className="text-xs text-muted">
        {theme === "light" ? "Light" : "Dark"}
      </span>
    </button>
  );
}


