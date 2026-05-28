"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Cross-route hash scroller.
 *
 * Next.js handles same-route hash navigation natively, but a fresh client-side
 * navigation from `/careers` → `/#products` lands the user at the top of the
 * homepage because the section element doesn't exist yet when the browser
 * tries to resolve the fragment. This component watches for path changes,
 * looks up `location.hash`, and scrolls to the matching element once it has
 * mounted (one rAF tick after the route transition).
 *
 * `scroll-padding-top` on `<html>` handles the fixed-header offset.
 *
 * Honors `prefers-reduced-motion` by passing `behavior: "auto"` when reduced
 * motion is requested — otherwise smooth scroll.
 */
export default function HashScroller() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (!hash || hash.length < 2) return;

    const prefersReduced = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const target = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (!target) return;

    // Wait one frame so the new route's components have mounted and laid out.
    const rafId = requestAnimationFrame(() => {
      target.scrollIntoView({
        behavior: prefersReduced ? "auto" : "smooth",
        block: "start",
      });
    });
    return () => cancelAnimationFrame(rafId);
  }, [pathname]);

  return null;
}
