"use client";

import { useEffect, useState } from "react";

/**
 * Subscribes to the user's `prefers-reduced-motion` setting.
 *
 * SSR-safe (`useState` initialiser runs server-side too, where we assume the
 * default = "no preference"; the client then re-evaluates after mount). The
 * hook re-renders if the OS-level setting changes mid-session.
 *
 * Note: do not gate hydration on the returned value or you'll trigger
 * hydration mismatches. Use it only to short-circuit motion *after* mount.
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;

    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mql.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    if (mql.addEventListener) {
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    }
    // Legacy Safari (< 14) — fall back to deprecated addListener.
    mql.addListener(handler);
    return () => mql.removeListener(handler);
  }, []);

  return prefersReduced;
}
