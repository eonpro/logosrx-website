import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E config.
 *
 * Prerequisites (see tests/e2e/README.md):
 *   - A running app, OR let Playwright start one (it runs `npm run dev`).
 *   - Clerk env is required even for the public specs, because the partner
 *     route group wraps pages in <ClerkProvider> and the middleware uses
 *     clerkMiddleware: set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY + CLERK_SECRET_KEY
 *     (a Clerk *test* instance).
 *   - Authenticated + data specs additionally need the DB migrated and seeded
 *     (`npm run db:seed-partners`) and Clerk test auth wired via @clerk/testing.
 *
 * Point at an already-running server (e.g. a preview deploy) by setting
 * PLAYWRIGHT_BASE_URL; in that case Playwright won't spawn its own server.
 */

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const useExternalServer = Boolean(process.env.PLAYWRIGHT_BASE_URL);

export default defineConfig({
  testDir: "./tests/e2e",
  testMatch: /.*\.spec\.ts/,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "desktop-chrome",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],
  webServer: useExternalServer
    ? undefined
    : {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
