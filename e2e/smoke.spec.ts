import { expect, test } from "@playwright/test";

test("welcome page loads", async ({ page }) => {
  await page.goto("/welcome");
  await expect(page).toHaveURL(/welcome/);
  await expect(page.locator("body")).toBeVisible();
});

test("login page is reachable", async ({ page }) => {
  await page.goto("/auth/login");
  await expect(page.getByLabel("Username or email")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
});

test("theme packs switch via data-theme", async ({ page }) => {
  await page.goto("/welcome");
  for (const style of ["glassmorphism", "neo-brutalism", "ethereal", "cyberpunk"]) {
    await page.evaluate((id) => {
      document.documentElement.dataset.theme = id;
      localStorage.setItem("ef-ui-style", id);
      window.dispatchEvent(new Event("ef-ui-style-change"));
    }, style);
    await expect(page.locator("html")).toHaveAttribute("data-theme", style);
    await expect(page.locator(".app-bg")).toBeVisible();
    await expect(page.locator(".glass-card").first()).toBeVisible();
  }
});
