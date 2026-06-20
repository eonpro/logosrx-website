import { test, expect } from "@playwright/test";

/**
 * Public smoke for the password-gated pricing quote page. Needs only the app
 * booted with Clerk test keys (no seeded DB): an unknown token renders the
 * branded "not available" state on the same AuthShell the login pages use,
 * which verifies the route, the shell chrome, and the logo render.
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
