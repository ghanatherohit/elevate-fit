"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BsSun, BsMoon } from "react-icons/bs";

const storageKey = "ef-theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    const initialTheme = stored === "light" ? "light" : "dark";
    setTheme(initialTheme);
    document.documentElement.classList.toggle("light", initialTheme === "light");
  }, []);

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
      onClick={handleToggle}
      className="group relative flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-left text-sm transition-all duration-300 hover:border-accent/40 hover:bg-card-strong focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50"
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      <div className="flex items-center gap-3">
        <motion.div
          key={theme}
          initial={{ scale: 0.5, opacity: 0, rotate: -180 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 0.5, opacity: 0, rotate: 180 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="text-accent"
        >
          {theme === "light" ? (
            <BsSun size={18} className="text-yellow-500" />
          ) : (
            <BsMoon size={18} className="text-blue-400" />
          )}
        </motion.div>
        <span className="text-foreground font-medium">Theme</span>
      </div>
      <motion.span
        key={`label-${theme}`}
        initial={{ opacity: 0, x: theme === "light" ? -10 : 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: theme === "light" ? 10 : -10 }}
        transition={{ duration: 0.2 }}
        className="text-xs text-muted transition-colors duration-300"
      >
        {theme === "light" ? "Light" : "Dark"}
      </motion.span>
    </button>
  );
}



