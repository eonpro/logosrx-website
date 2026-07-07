"use client";

import Image from "next/image";
import { displayFont } from "@/lib/fonts";

/**
 * Hims-style intake chrome: a slim top bar (wordmark left, step counter
 * right) with the progress bar directly beneath it, then a roomy left-aligned
 * question column. Serif display headlines come from `StepHeading`.
 */
export default function OnboardingShell({
  progress,
  step,
  totalSteps,
  children,
}: {
  /** 0-100, drives the top progress bar. */
  progress: number;
  /** 1-based current step — shown as "Step X of Y" when provided. */
  step?: number;
  totalSteps?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`theme-ink ${displayFont.variable} flex min-h-screen flex-col bg-cream`}
    >
      <header className="sticky top-0 z-20 bg-cream/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-6">
          <Image
            src="/images/logo.svg"
            alt="Logos RX"
            width={132}
            height={42}
            priority
            className="h-8 w-auto"
          />
          {step != null && totalSteps != null && (
            <p className="text-[12px] font-semibold tabular-nums text-navy/45">
              Step {Math.min(step, totalSteps)}{" "}
              <span className="text-navy/30">of {totalSteps}</span>
            </p>
          )}
        </div>
        <div className="h-1 w-full bg-beige/70">
          <div
            className="h-full rounded-r-full bg-navy transition-[width] duration-500 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            role="progressbar"
            aria-valuenow={Math.round(progress)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Onboarding progress"
          />
        </div>
      </header>

      <main className="flex flex-1 justify-center px-6 pb-16 pt-12 sm:pt-16">
        <div className="w-full max-w-[33rem]">{children}</div>
      </main>

      <footer className="pb-8 text-center text-[11px] text-navy/35">
        &copy; {new Date().getFullYear()} Logos RX. All Rights Reserved.
      </footer>
    </div>
  );
}
