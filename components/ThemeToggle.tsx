"use client";

import { useEffect, useState } from "react";

const storageKey = "ef-theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    const next = stored === "light" ? "light" : "dark";
    setTheme(next);
  }, []);

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
      className="flex items-center justify-between rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 text-left text-sm"
      onClick={handleToggle}
    >
      <span className="text-[color:var(--text)]">Theme</span>
      <span className="text-xs text-[color:var(--muted)]">
        {theme === "light" ? "Light" : "Dark"}
      </span>
    </button>
  );
}
