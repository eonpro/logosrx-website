"use client";

import Image from "next/image";

/**
 * Light single-column layout for the intake wizard, hims-style: warm
 * off-white canvas, thin ink progress bar pinned to the top, wordmark, and a
 * roomy centered content column.
 */
export default function OnboardingShell({
  progress,
  children,
}: {
  /** 0-100, drives the top progress bar. */
  progress: number;
  children: React.ReactNode;
}) {
  return (
    <div className="theme-ink flex min-h-screen flex-col bg-cream">
      <div className="fixed inset-x-0 top-0 z-20 h-1 bg-beige/70">
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

      <main className="flex flex-1 items-start justify-center px-6 py-14 sm:py-20">
        <div className="w-full max-w-[30rem]">
          <div className="mb-11 flex flex-col items-center text-center">
            <Image
              src="/images/logo.svg"
              alt="Logos RX"
              width={160}
              height={51}
              priority
              className="h-10 w-auto"
            />
            <p className="mt-2.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-navy/35">
              Compounding Excellence
            </p>
          </div>
          {children}
        </div>
      </main>

      <footer className="pb-8 text-center text-[11px] text-navy/35">
        &copy; {new Date().getFullYear()} Logos RX. All Rights Reserved.
      </footer>
    </div>
  );
}
