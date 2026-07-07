"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

/**
 * Minimal light chrome for the auth + gated flows (sign-in, sign-up, activate,
 * partner apply, quote gate). Centered column on a near-white surface, black
 * text, hairline details — matches the portal "ink" theme (see globals.css).
 */
export default function AuthShell({
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
  const widthClass = width === "wide" ? "max-w-3xl" : "max-w-[420px]";
  return (
    <div className="theme-ink relative flex min-h-screen items-center justify-center overflow-y-auto bg-cream py-12 sm:py-16">
      <div className={`relative z-10 w-full ${widthClass} px-6`}>
        <motion.div
          className="mb-10 flex flex-col items-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Image
            src="/images/logo.svg"
            alt="Logos RX"
            width={200}
            height={64}
            className="mb-4 h-12 w-auto"
            priority
          />
          {subtitle && (
            <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-navy/40">
              {subtitle}
            </p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {children}
        </motion.div>

        <motion.div
          className="mt-10 flex flex-col items-center gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {footerLink && (
            <p className="text-sm text-navy/60">
              {footerLink.text}{" "}
              <Link
                href={footerLink.href}
                className="font-semibold text-navy underline-offset-4 transition-colors hover:underline"
              >
                {footerLink.label}
              </Link>
            </p>
          )}
          {crossLink && (
            <p className="-mt-3 text-[13px] text-navy/45">
              {crossLink.text}{" "}
              <Link
                href={crossLink.href}
                className="text-navy/60 underline-offset-2 transition-colors hover:text-navy hover:underline"
              >
                {crossLink.label}
              </Link>
            </p>
          )}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1.5 text-navy/35">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="6" width="8" height="6" rx="1.5" strokeLinecap="round" />
                <path d="M4.5 6V4.5a2.5 2.5 0 015 0V6" strokeLinecap="round" />
              </svg>
              <span className="text-[11px] tracking-wide">Encrypted</span>
            </div>
            <div className="flex items-center gap-1.5 text-navy/35">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M7 1L2 3.5v3c0 3.5 2.1 5.5 5 7 2.9-1.5 5-3.5 5-7v-3L7 1z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[11px] tracking-wide">HIPAA Compliant</span>
            </div>
            <div className="flex items-center gap-1.5 text-navy/35">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="7" cy="7" r="5.5" />
                <path d="M4.5 7l1.5 1.5L9.5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[11px] tracking-wide">SOC 2</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/" className="text-[11px] text-navy/35 transition-colors hover:text-navy">
              logosrx.com
            </Link>
            <span className="text-[11px] text-navy/20">&bull;</span>
            <span className="text-[11px] text-navy/35">
              &copy; {new Date().getFullYear()} Logos RX
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
