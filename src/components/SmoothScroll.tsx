"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Mounts Lenis smooth-scroll globally for the marketing surface.
 *
 * Respects `prefers-reduced-motion`: if the user has motion reduction enabled
 * we skip Lenis entirely and let the browser do native, instant scrolling.
 * We can't use the `usePrefersReducedMotion` hook here without an extra
 * render, so we query the media list directly inside the effect.
 */
export default function SmoothScroll() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mql.matches) return;

    // Keep the smoothing subtle: a long `duration` adds noticeable inertia
    // that reads as "laggy". ~0.8s with a `lerp` gives a responsive glide that
    // still tracks the input closely. Touch devices use native scrolling
    // (smoothTouch off) so mobile never feels rubber-banded.
    const lenis = new Lenis({
      duration: 0.8,
      lerp: 0.12,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      autoRaf: true,
    });

    // If the user toggles the preference while the tab is open, destroy Lenis
    // so the page snaps back to native scrolling.
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) lenis.destroy();
    };
    mql.addEventListener?.("change", onChange);

    return () => {
      mql.removeEventListener?.("change", onChange);
      lenis.destroy();
    };
  }, []);

  return null;
}
