"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const READY_SELECTOR =
  ".cl-formButtonPrimary, .cl-socialButtonsBlockButton, .cl-card input";

/**
 * Shows a dark-theme form skeleton until Clerk's SignIn/SignUp card paints.
 * Without this, AuthShell renders logo + footer with an empty gap while
 * clerk-js + @clerk/ui hydrate — which reads as a broken/slow login page.
 */
export default function ClerkAuthSlot({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    let cancelled = false;

    const markReady = () => {
      if (!cancelled) setReady(true);
    };

    const observer = new MutationObserver(() => {
      if (root.querySelector(READY_SELECTOR)) {
        observer.disconnect();
        markReady();
      }
    });
    observer.observe(root, { childList: true, subtree: true });

    // Defer the initial check so we never call setState synchronously inside
    // the effect body (react-hooks/set-state-in-effect).
    const raf = requestAnimationFrame(() => {
      if (root.querySelector(READY_SELECTOR)) {
        observer.disconnect();
        markReady();
      }
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  return (
    <div ref={rootRef} className="relative w-full">
      {!ready && <AuthFormSkeleton />}
      <div className={ready ? undefined : "invisible absolute inset-x-0 top-0"}>
        {children}
      </div>
    </div>
  );
}

function AuthFormSkeleton() {
  return (
    <div className="flex w-full flex-col gap-5" role="status" aria-live="polite">
      <span className="sr-only">Loading sign-in form</span>
      <div className="h-12 w-full animate-pulse rounded-xl border border-white/10 bg-white/5" aria-hidden />
      <div className="flex items-center gap-3" aria-hidden>
        <div className="h-px flex-1 bg-white/10" />
        <div className="h-3 w-8 rounded bg-white/10" />
        <div className="h-px flex-1 bg-white/10" />
      </div>
      <div className="flex flex-col gap-2" aria-hidden>
        <div className="h-3 w-40 rounded bg-white/10" />
        <div className="h-12 w-full animate-pulse rounded-xl border border-white/10 bg-white/5" />
      </div>
      <div className="h-12 w-full animate-pulse rounded-xl bg-magenta/40" aria-hidden />
    </div>
  );
}
