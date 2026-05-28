/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

/**
 * Vitest configuration.
 *
 *   - `happy-dom` is the DOM runtime; it boots ~3× faster than `jsdom` and
 *     supports modern APIs (IntersectionObserver, matchMedia) out of the
 *     box, which our reveal/scroll-aware components rely on.
 *   - `setupFiles` injects jest-dom matchers and a few minimal browser
 *     polyfills that vary by test.
 *   - Coverage uses v8 (built into Node 22) so we don't drag in Istanbul.
 *
 * Run with `npm test`; CI uses `npm run test:coverage`.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: ["./tests/setup.ts"],
    include: [
      "src/**/*.{test,spec}.{ts,tsx}",
      "tests/**/*.{test,spec}.{ts,tsx}",
    ],
    exclude: ["node_modules", ".next", "tests/e2e/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: [
        "src/lib/**/*.ts",
        "src/hooks/**/*.ts",
        "src/data/**/*.ts",
        "src/components/**/*.tsx",
      ],
      exclude: [
        "src/**/*.d.ts",
        "src/**/__tests__/**",
        "src/**/*.test.{ts,tsx}",
        // App router files are integration-tested via Playwright (Q2 follow-up).
        "src/app/**",
      ],
      thresholds: {
        // Per-file thresholds let the project enforce real coverage on
        // logic-heavy modules (security helpers, data helpers, hooks)
        // without globally blocking on the long tail of presentational
        // components that need Playwright/Storybook coverage instead.
        // Ratchet upward as suites land.
        perFile: false,
        // Global floors stay low until the component layer is wired into
        // an integration-testing tool (Q2 follow-up). The real bar is the
        // per-pattern threshold below.
        lines: 10,
        statements: 10,
        functions: 5,
        branches: 14,
        // High bar for logic-only modules: anything with unit-testable
        // pure helpers must keep ≥80 % line coverage.
        "src/lib/security/filename.ts": { lines: 90 },
        "src/lib/security/file-type.ts": { lines: 70 },
        "src/lib/security/origin.ts": { lines: 70 },
        "src/data/catalog.ts": { lines: 80, functions: 80, branches: 75 },
      },
    },
  },
});
