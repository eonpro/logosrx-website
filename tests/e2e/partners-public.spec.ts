import { test, expect } from "@playwright/test";

/**
 * Public / middleware-level E2E for the affiliate partner portal. These specs
 * need only the app booted with Clerk test keys (no seeded DB, no sign-in):
 * they exercise routing, middleware protection, and server-rendered chrome.
 *
 * Authenticated journeys (apply -> approve -> link -> attribute -> transaction
 * -> payout) live in partners-auth.spec.ts and are gated on Clerk test auth.
 */

test.describe("partner portal — public & middleware", () => {
  test("unauthenticated /partners shows the public landing page", async ({
    page,
  }) => {
    // `/partners` is a public, top-of-funnel marketing landing page until the
    // visitor signs in — it must NOT redirect. (Protected sub-routes still do;
    // see the next test.) Anonymous visitors get the landing with both CTAs.
    await page.goto("/partners");
    await expect(page).toHaveURL(/\/partners$/);
    await expect(
      page.getByRole("heading", { name: /work with logos rx/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /apply to become a partner/i }),
    ).toBeVisible();
  });

  test("a protected sub-route preserves the intended destination", async ({
    page,
  }) => {
    await page.goto("/partners/transactions");
    await expect(page).toHaveURL(/\/partners\/sign-in/);
    // Middleware appends the original path so sign-in can bounce back.
    await expect(page).toHaveURL(/redirect_url=/);
  });

  test("the partner sign-in page renders the portal chrome", async ({
    page,
  }) => {
    await page.goto("/partners/sign-in");
    // AuthShell subtitle is server-rendered (independent of the Clerk widget).
    await expect(page.getByText("Partner Portal", { exact: false })).toBeVisible();
  });

  test("the public application form renders its fields", async ({ page }) => {
    await page.goto("/partners/apply");
    await expect(
      page.getByRole("heading", { name: /become a logos rx.*partner/i }),
    ).toBeVisible();
    await expect(page.getByPlaceholder("Acme Sales Group")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /submit application/i }),
    ).toBeVisible();
  });

  test("the application form blocks submission without required fields", async ({
    page,
  }) => {
    await page.goto("/partners/apply");
    await page.getByRole("button", { name: /submit application/i }).click();
    // Native validation keeps us on the form; the success state never shows.
    await expect(page).toHaveURL(/\/partners\/apply/);
    await expect(
      page.getByRole("heading", { name: /application received/i }),
    ).toHaveCount(0);
  });

  test("a referral link redirects into onboarding", async ({ page }) => {
    // Unknown codes still forward to onboarding (a dead link must never
    // dead-end a prospective clinic); known codes additionally set the cookie.
    await page.goto("/join/demoacme01");
    await expect(page).toHaveURL(/\/onboarding/);
  });
});
