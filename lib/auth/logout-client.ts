"use client";

import { signOut } from "firebase/auth";
import { firebaseAuth } from "@/lib/auth/firebase-client";
import { DEFAULT_UI_STYLE, UI_STYLE_STORAGE_KEY } from "@/lib/theme/styles";

type LogoutOptions = {
  /** Reset UI style to the product default after a successful logout. */
  resetTheme?: boolean;
};

/**
 * Clears server session + Firebase client auth.
 * Returns false if the server logout request failed.
 */
export async function logoutClient(
  options: LogoutOptions = { resetTheme: true },
): Promise<boolean> {
  const response = await fetch("/api/auth/logout", { method: "POST" });
  if (!response.ok) {
    return false;
  }

  try {
    await signOut(firebaseAuth);
  } catch {
    // Server cookie is already cleared; client sign-out is best-effort.
  }

  if (options.resetTheme !== false) {
    localStorage.setItem(UI_STYLE_STORAGE_KEY, DEFAULT_UI_STYLE);
    document.documentElement.dataset.theme = DEFAULT_UI_STYLE;
    window.dispatchEvent(new Event("ef-ui-style-change"));
  }

  return true;
}
