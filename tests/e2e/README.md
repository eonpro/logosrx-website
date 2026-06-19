# End-to-end tests (Playwright)

E2E specs for the affiliate partner portal. Unit/integration tests still run
under Vitest (`npm test`); Vitest is configured to ignore `tests/e2e/**`.

## Install browsers (one time)

```bash
npm run e2e:install
```

## Run

```bash
npm run e2e          # headless
npm run e2e:ui       # Playwright UI mode
```

By default Playwright starts the app itself (`npm run dev`). To run against an
already-running server (e.g. a preview deploy), set `PLAYWRIGHT_BASE_URL` and
Playwright will skip spawning a server:

```bash
PLAYWRIGHT_BASE_URL=https://my-preview.vercel.app npm run e2e
```

## Required environment

**Public specs** (`partners-public.spec.ts`) cover routing, middleware
protection, and server-rendered chrome. They still need Clerk **test** keys,
because the partner route group wraps pages in `<ClerkProvider>` and the
middleware uses `clerkMiddleware`:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

**Authenticated specs** (`partners-auth.spec.ts`, skipped unless
`E2E_PARTNER_AUTH=1`) additionally require:

1. A migrated DB and seed data:
   ```bash
   npx tsx scripts/apply-sql.ts scripts/sql/0004_partner_portal.sql
   DEMO_ORG_CLERK_USER_ID=user_xxx npm run db:seed-partners
   ```
   Use the Clerk **test** user id you'll sign in as for `DEMO_ORG_CLERK_USER_ID`
   so the seeded "Acme Sales Group" org is owned by your test login.
2. A signed-in browser context. The recommended approach is `@clerk/testing`:
   - `npm i -D @clerk/testing`
   - Add a Playwright global setup that calls `clerkSetup()` and signs the test
     user in, persisting `storageState` for the `desktop-chrome` /
     `mobile-chrome` projects.
   - See: https://clerk.com/docs/testing/playwright/overview
3. `E2E_PARTNER_AUTH=1` to un-skip the suite.

## Projects

- `desktop-chrome` — Desktop Chrome viewport.
- `mobile-chrome` — Pixel 5 viewport (exercises the responsive sidebar drawer).
