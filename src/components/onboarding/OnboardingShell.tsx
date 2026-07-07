"use client";

import Image from "next/image";

/**
 * Light-themed, single-column layout for the intake wizard and dashboard
 * editor: a thin progress bar pinned to the top, the Logos wordmark, and a
 * centered content column. Mirrors the reference onboarding design.
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
    <div className="theme-ink flex min-h-screen flex-col bg-white">
      <div className="fixed inset-x-0 top-0 z-20 h-1 bg-beige/60">
        <div
          className="h-full bg-navy transition-[width] duration-500 ease-out"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Onboarding progress"
        />
      </div>

      <main className="flex flex-1 items-start justify-center px-6 py-16 sm:py-20">
        <div className="w-full max-w-md">
          <div className="mb-10 flex flex-col items-center text-center">
            <Image
              src="/images/logo.svg"
              alt="Logos RX"
              width={160}
              height={51}
              priority
              className="h-11 w-auto"
            />
            <p className="mt-2 text-xs tracking-wide text-navy/35">
              Compounding Excellence
            </p>
          </div>
          {children}
        </div>
      </main>

      <footer className="pb-8 text-center text-[11px] text-navy/30">
        &copy; {new Date().getFullYear()} Logos RX. All Rights Reserved.
      </footer>
    </div>
  );
}
