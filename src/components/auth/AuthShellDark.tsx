"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

function GradientOrb({
  className,
  delay = 0,
}: {
  className: string;
  delay?: number;
}) {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <motion.div
      aria-hidden
      // `transform-gpu` + `will-change-transform` keep the blurred layer on
      // its own compositor layer so the heavy `blur(120px)` is rasterized once
      // instead of every animation frame. Without this, Safari re-rasterizes
      // the blur each tick, which pins the main thread and can drop pointer
      // events on the form (the field looks normal but won't accept clicks).
      className={`pointer-events-none absolute transform-gpu rounded-full opacity-30 blur-[120px] will-change-transform ${className}`}
      animate={
        prefersReducedMotion
          ? undefined
          : {
              scale: [1, 1.2, 1],
              x: [0, 30, -20, 0],
              y: [0, -25, 15, 0],
            }
      }
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: "easeInOut",
        delay,
      }}
    />
  );
}

/**
 * Original dark chrome for the Clerk sign-in / sign-up pages (deep-navy
 * gradient + animated orbs). The gated flows (activate, partner apply, quote)
 * use the light `AuthShell` instead; this dark shell is reserved for the
 * login surfaces per design direction.
 */
export default function AuthShellDark({
  children,
  subtitle,
  footerLink,
  crossLink,
  width = "narrow",
}: {
  children: React.ReactNode;
  subtitle?: string;
  footerLink?: { label: string; text: string; href: string };
  /**
   * Optional pointer to the *other* portal (e.g. from the clinic/provider
   * sign-in to the partner sign-in). Rendered as a subtle secondary line so a
   * person who landed on the wrong portal can self-correct.
   */
  crossLink?: { label: string; text: string; href: string };
  /** `wide` widens the content column for richer pages (e.g. a pricing quote). */
  width?: "narrow" | "wide";
}) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const widthClass = width === "wide" ? "max-w-3xl" : "max-w-[420px]";
  const chromeMotion = prefersReducedMotion
    ? undefined
    : { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 } };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-y-auto bg-[#0c0a1d] py-12 sm:py-16">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#1a1750_0%,#0c0a1d_70%)]" />
        <GradientOrb
          className="w-[600px] h-[600px] bg-magenta/60 -top-48 -right-48"
          delay={0}
        />
        <GradientOrb
          className="w-[500px] h-[500px] bg-purple-deep/60 -bottom-32 -left-32"
          delay={4}
        />
        <GradientOrb
          className="w-[400px] h-[400px] bg-sky/40 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          delay={8}
        />
      </div>

      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        aria-hidden
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      <div className={`relative z-10 w-full ${widthClass} px-6`}>
        <motion.div
          className="mb-10 flex flex-col items-center"
          {...(chromeMotion ?? {})}
          transition={{ duration: 0.35 }}
        >
          <Image
            src="/images/logo-white.svg"
            alt="Logos RX"
            width={200}
            height={64}
            className="h-14 w-auto mb-4"
            priority
          />
          {subtitle && (
            <p className="text-white/45 text-[11px] tracking-[0.25em] uppercase font-medium">
              {subtitle}
            </p>
          )}
        </motion.div>

        {/* Form slot: no enter animation — Clerk hydrate + skeleton already
            define perceived load; fading the form in adds a second delay. */}
        <div>{children}</div>

        <motion.div
          className="mt-10 flex flex-col items-center gap-6"
          {...(chromeMotion ?? {})}
          transition={{ duration: 0.35, delay: prefersReducedMotion ? 0 : 0.05 }}
        >
          {footerLink && (
            <p className="text-sm text-white/80">
              {footerLink.text}{" "}
              <Link
                href={footerLink.href}
                className="text-magenta-light hover:text-white transition-colors font-medium"
              >
                {footerLink.label}
              </Link>
            </p>
          )}
          {crossLink && (
            <p className="-mt-3 text-[13px] text-white/50">
              {crossLink.text}{" "}
              <Link
                href={crossLink.href}
                className="text-white/70 underline-offset-2 transition-colors hover:text-white hover:underline"
              >
                {crossLink.label}
              </Link>
            </p>
          )}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 text-white/40">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="6" width="8" height="6" rx="1.5" strokeLinecap="round" />
                <path d="M4.5 6V4.5a2.5 2.5 0 015 0V6" strokeLinecap="round" />
              </svg>
              <span className="text-[11px] tracking-wide">Encrypted</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/40">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M7 1L2 3.5v3c0 3.5 2.1 5.5 5 7 2.9-1.5 5-3.5 5-7v-3L7 1z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[11px] tracking-wide">HIPAA Compliant</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/40">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="7" cy="7" r="5.5" />
                <path d="M4.5 7l1.5 1.5L9.5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[11px] tracking-wide">SOC 2</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/" className="text-[11px] text-white/40 hover:text-white/80 transition-colors">
              logosrx.com
            </Link>
            <span className="text-white/20 text-[11px]">&bull;</span>
            <span className="text-[11px] text-white/40">
              &copy; {new Date().getFullYear()} Logos RX
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
