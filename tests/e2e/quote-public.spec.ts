import { test, expect } from "@playwright/test";

/**
 * Smoke for the password-gated pricing quote page. The `/quote/[token]` route
 * looks the token up in the database before rendering (even the "not found"
 * state), so this spec needs a reachable DB — it is NOT part of the DB-free CI
 * smoke. Run it against a real deploy (a seeded preview) via PLAYWRIGHT_BASE_URL.
 *
 * An unknown token renders the branded "not available" state on the same
 * AuthShell the login pages use, verifying the route, the shell chrome, and
 * the logo render.
 */

test.describe("pricing quote — public", () => {
  test("an unknown quote token renders the branded shell", async ({ page }) => {
    await page.goto("/quote/this-token-does-not-exist");
    // AuthShell subtitle is server-rendered regardless of quote state.
    await expect(page.getByText("Pricing Quote", { exact: false })).toBeVisible();
    // The Logos RX logo (shared with the login pages) is present.
    await expect(page.getByAltText(/logos rx/i)).toBeVisible();
  });
});
