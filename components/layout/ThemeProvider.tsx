"use client";

import { useEffect } from "react";

const storageKey = "ef-theme";

function applyTheme(theme: string) {
  if (typeof document === "undefined") {
    return;
  }
  const root = document.documentElement;
  if (theme === "light") {
    root.classList.add("light");
  } else {
    root.classList.remove("light");
  }
}

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    const theme = stored === "light" ? "light" : "dark";
    applyTheme(theme);

    const handleStorage = (event: StorageEvent) => {
      if (event.key === storageKey && event.newValue) {
        applyTheme(event.newValue);
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return <>{children}</>;
}
