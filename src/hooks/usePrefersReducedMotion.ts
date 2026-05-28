"use client";

import { useSyncExternalStore } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(callback: () => void): () => void {
  if (typeof window === "undefined" || !window.matchMedia) {
    return () => {};
  }
  const mql = window.matchMedia(REDUCED_MOTION_QUERY);
  if (mql.addEventListener) {
    mql.addEventListener("change", callback);
    return () => mql.removeEventListener("change", callback);
  }
  mql.addListener(callback);
  return () => mql.removeListener(callback);
}

function getClientSnapshot(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

function getServerSnapshot(): boolean {
  return false;
}

/**
 * Subscribes to the user's `prefers-reduced-motion` setting.
 *
 * Backed by `useSyncExternalStore` so React handles the SSR ↔ client
 * snapshot bridge for us and never tears during concurrent renders.
 * The server snapshot is `false` (the safe default — animations on); the
 * client snapshot is read synchronously from `matchMedia` on every render
 * and re-reads when the OS-level setting changes mid-session.
 *
 * Note: do not gate hydration on the returned value or you'll trigger
 * hydration mismatches. Use it only to short-circuit motion *after* mount.
 */
export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
