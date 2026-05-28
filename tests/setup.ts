import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Unmount React trees between tests so a leftover modal or dialog doesn't
// poison the next assertion's DOM query.
afterEach(() => {
  cleanup();
});

/*
 * happy-dom ships `matchMedia` as `undefined`. A handful of our hooks
 * (e.g. `usePrefersReducedMotion`) call it directly, so stub a passive
 * implementation that the tests can override per case via `vi.spyOn`.
 */
if (typeof window !== "undefined" && typeof window.matchMedia === "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

/*
 * Silence noisy `console.error` output during expected error-path tests.
 * Individual tests can opt back in by overriding the spy.
 */
vi.spyOn(console, "error").mockImplementation(() => {});
vi.spyOn(console, "warn").mockImplementation(() => {});
