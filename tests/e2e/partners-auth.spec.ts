import { test, expect } from "@playwright/test";

/**
 * Authenticated partner-portal journey. SKIPPED by default — it requires:
 *   1. The DB migrated and seeded:  npm run db:seed-partners
 *      (with DEMO_ORG_CLERK_USER_ID set to the Clerk test user you sign in as).
 *   2. Clerk test auth wired so the browser context starts signed in as that
 *      user — see tests/e2e/README.md (uses @clerk/testing global setup).
 *   3. E2E_PARTNER_AUTH=1 to enable the suite.
 *
 * Once enabled, these assert the seeded "Acme Sales Group" data and the
 * responsive sidebar.
 */

const ENABLED = process.env.E2E_PARTNER_AUTH === "1";

test.describe("partner portal — authenticated journey", () => {
  test.skip(
    !ENABLED,
    "Set E2E_PARTNER_AUTH=1 with Clerk test auth + seeded DB (see README).",
  );

  test("dashboard shows the org's revenue and commission", async ({ page }) => {
    await page.goto("/partners");
    await expect(
      page.getByRole("heading", { name: /welcome, acme sales group/i }),
    ).toBeVisible();
    // Headline stat cards.
    await expect(page.getByText(/Revenue \(/i)).toBeVisible();
    await expect(page.getByText(/Commission earned \(/i)).toBeVisible();
  });

  test("date-range filter changes the dashboard window", async ({ page }) => {
    await page.goto("/partners");
    await page.getByRole("link", { name: "All time" }).click();
    await expect(page).toHaveURL(/range=all/);
    await expect(
      page.getByRole("link", { name: "All time" }),
    ).toHaveAttribute("aria-current", "page");
  });

  test("transactions list renders attributed rows with commission", async ({
    page,
  }) => {
    await page.goto("/partners/transactions");
    await expect(
      page.getByRole("heading", { name: /transactions/i }),
    ).toBeVisible();
    await expect(page.getByText("Your commission").first()).toBeVisible();
  });

  test("org owner can manage reps", async ({ page }) => {
    await page.goto("/partners/reps");
    await expect(page.getByRole("heading", { name: /reps/i })).toBeVisible();
    await expect(page.getByText("Alex Johnson")).toBeVisible();
  });

  test("a rep rate above the org rate is rejected", async ({ page }) => {
    await page.goto("/partners/reps");
    const rate = page.getByLabel(/commission percent for alex johnson/i);
    await rate.fill("99");
    await rate.blur();
    await expect(page.getByText(/cannot exceed your organization/i)).toBeVisible();
  });

  test("links page generates and lists a referral link", async ({ page }) => {
    await page.goto("/partners/links");
    await expect(
      page.getByRole("heading", { name: /referral links/i }),
    ).toBeVisible();
    await page.getByRole("button", { name: /generate link/i }).click();
    await expect(page.getByRole("button", { name: "Copy" }).first()).toBeVisible();
  });

  test("mobile: the sidebar collapses behind a menu toggle", async ({
    page,
  }) => {
    const width = page.viewportSize()?.width ?? 1280;
    test.skip(width >= 1024, "Drawer only applies below the lg breakpoint.");

    await page.goto("/partners");
    const repsLink = page.getByRole("link", { name: "Referral Links" });
    // Hidden while the drawer is closed on mobile.
    await expect(repsLink).toBeHidden();

    await page.getByRole("button", { name: "Open menu" }).click();
    await expect(repsLink).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(repsLink).toBeHidden();
  });
});
