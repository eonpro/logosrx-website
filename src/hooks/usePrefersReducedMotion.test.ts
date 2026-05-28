import { describe, expect, it, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

interface FakeMql {
  matches: boolean;
  media: string;
  onchange: ((e: MediaQueryListEvent) => void) | null;
  listeners: Array<(e: MediaQueryListEvent) => void>;
  addEventListener: (
    type: "change",
    listener: (e: MediaQueryListEvent) => void,
  ) => void;
  removeEventListener: (
    type: "change",
    listener: (e: MediaQueryListEvent) => void,
  ) => void;
}

function fakeMatchMedia(initial: boolean): {
  mql: FakeMql;
  trigger: (matches: boolean) => void;
} {
  const mql: FakeMql = {
    matches: initial,
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    listeners: [],
    addEventListener(_type, listener) {
      mql.listeners.push(listener);
    },
    removeEventListener(_type, listener) {
      mql.listeners = mql.listeners.filter((l) => l !== listener);
    },
  };
  return {
    mql,
    trigger(matches) {
      mql.matches = matches;
      const event = { matches, media: mql.media } as MediaQueryListEvent;
      for (const l of mql.listeners) l(event);
    },
  };
}

describe("usePrefersReducedMotion", () => {
  it("returns false when the user has no preference", () => {
    const { mql } = fakeMatchMedia(false);
    vi.spyOn(window, "matchMedia").mockReturnValue(
      mql as unknown as MediaQueryList,
    );

    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });

  it("returns true when the user has opted into reduced motion", () => {
    const { mql } = fakeMatchMedia(true);
    vi.spyOn(window, "matchMedia").mockReturnValue(
      mql as unknown as MediaQueryList,
    );

    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);
  });

  it("updates when the preference changes mid-session", () => {
    const { mql, trigger } = fakeMatchMedia(false);
    vi.spyOn(window, "matchMedia").mockReturnValue(
      mql as unknown as MediaQueryList,
    );

    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);

    act(() => {
      trigger(true);
    });
    expect(result.current).toBe(true);

    act(() => {
      trigger(false);
    });
    expect(result.current).toBe(false);
  });

  it("unsubscribes the listener on unmount", () => {
    const { mql, trigger } = fakeMatchMedia(false);
    vi.spyOn(window, "matchMedia").mockReturnValue(
      mql as unknown as MediaQueryList,
    );

    const { unmount, result } = renderHook(() => usePrefersReducedMotion());
    expect(mql.listeners.length).toBe(1);

    unmount();
    expect(mql.listeners.length).toBe(0);

    // After unmount, triggering must not throw.
    act(() => {
      trigger(true);
    });
    expect(result.current).toBe(false);
  });
});
