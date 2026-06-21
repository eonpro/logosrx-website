"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

/**
 * Public landing page for the Logos RX marketing partner program, shown at
 * `/partners` to anonymous visitors. Active partners get the dashboard and
 * signed-in non-partners get `PartnerNoAccess`; this is the top-of-funnel
 * entry point whose only job is to route people into the two CTAs:
 *   - Apply    → /partners/apply
 *   - Sign in  → /partners/sign-in
 *
 * COMPLIANCE: A pharmacy may not pay for referrals or pay compensation that
 * varies with the volume/value of prescriptions or orders (Anti-Kickback
 * Statute, EKRA, and state anti-kickback/fee-splitting laws). All copy here
 * must describe a *bona fide marketing services* relationship paid via a
 * *fixed, fair-market-value fee* under a Marketing Services Agreement — never
 * referral commissions or a percentage of sales. Keep the disclaimer below in
 * sync with the executed MSA, and route copy changes past legal.
 *
 * Styling intentionally mirrors `AuthShell` (deep-navy gradient, animated
 * magenta orbs) so the funnel — landing → apply/sign-in — feels continuous.
 */

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

const VALUE_PROPS = [
  {
    title: "Fixed, fair-market-value fees",
    body: "You're paid a predetermined, fair-market-value fee for bona fide marketing services — never a percentage of sales, prescriptions, orders, or referrals.",
    icon: (
      <path
        d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
  {
    title: "A genuine marketing partnership",
    body: "Collaborate with our team on brand development, advertising, content, and general (non-clinical) audience promotion for the pharmacy.",
    icon: (
      <>
        <circle cx="9" cy="8" r="3.2" />
        <path
          d="M3 19c0-3.3 2.7-6 6-6s6 2.7 6 6M17 9.5a3 3 0 100-6M16.5 14c3 .3 5.5 2.8 5.5 6"
          strokeLinecap="round"
        />
      </>
    ),
  },
  {
    title: "Clear, compliant agreements",
    body: "Every engagement is governed by a written Marketing Services Agreement designed to comply with applicable federal and state healthcare laws.",
    icon: (
      <>
        <path
          d="M6 2h8l4 4v14a1 1 0 01-1 1H6a1 1 0 01-1-1V3a1 1 0 011-1z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M13 2v5h5M8.5 13l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
];

const STEPS = [
  {
    n: "01",
    title: "Apply",
    body: "Tell us about your marketing capabilities and the brand-support services you can provide.",
  },
  {
    n: "02",
    title: "Sign your agreement",
    body: "We review your application and put a Marketing Services Agreement in place defining the scope of work and a fixed fee.",
  },
  {
    n: "03",
    title: "Deliver & get paid",
    body: "Provide the agreed marketing and brand-support services and receive your fixed, fair-market-value fee.",
  },
];

export default function PartnerLanding() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0c0a1d] text-white">
      {/* Ambient background — matches the auth pages */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#1a1750_0%,#0c0a1d_70%)]" />
        <GradientOrb
          className="h-[600px] w-[600px] bg-magenta/60 -top-48 -right-48"
          delay={0}
        />
        <GradientOrb
          className="h-[500px] w-[500px] bg-purple-deep/60 top-1/3 -left-40"
          delay={4}
        />
        <GradientOrb
          className="h-[400px] w-[400px] bg-sky/40 bottom-0 right-1/4"
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

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col px-6 py-10 sm:py-14">
        {/* Top bar */}
        <header className="flex items-center justify-between">
          <Link href="/" aria-label="Logos RX home">
            <Image
              src="/images/logo-white.svg"
              alt="Logos RX"
              width={150}
              height={48}
              className="h-9 w-auto"
              priority
            />
          </Link>
          <Link
            href="/partners/sign-in"
            className="text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            Sign in
          </Link>
        </header>

        {/* Hero */}
        <section className="flex flex-col items-center pt-20 pb-16 text-center sm:pt-28 sm:pb-24">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-[11px] font-medium uppercase tracking-[0.25em] text-magenta-light"
          >
            Marketing Partner Program
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mt-5 max-w-3xl text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl"
          >
            Market with{" "}
            <span className="bg-linear-to-r from-magenta-light to-magenta bg-clip-text text-transparent">
              Logos RX
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-6 max-w-xl text-lg text-white/60"
          >
            Provide bona fide marketing and brand-support services for a
            multi-state licensed 503A compounding pharmacy, and earn a fixed,
            fair-market-value fee under a Marketing Services Agreement.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
          >
            <Link
              href="/partners/apply"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-magenta to-magenta-dark px-8 text-[15px] font-semibold text-white shadow-[0_0_24px_rgba(198,46,136,0.3)] transition-all hover:shadow-[0_0_32px_rgba(198,46,136,0.5)]"
            >
              Apply to become a partner
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M3 7h8M7.5 3.5L11 7l-3.5 3.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <Link
              href="/partners/sign-in"
              className="inline-flex h-12 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-8 text-[15px] font-semibold text-white transition-colors hover:border-white/30 hover:bg-white/10"
            >
              Partner sign in
            </Link>
          </motion.div>

          {/* Trust strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-white/35"
          >
            <span className="text-sm">
              <span className="font-semibold text-white/70">5,000+</span>{" "}
              providers
            </span>
            <span className="h-1 w-1 rounded-full bg-white/20" />
            <span className="text-sm">
              Licensed in{" "}
              <span className="font-semibold text-white/70">25</span>{" "}
              jurisdictions
            </span>
            <span className="h-1 w-1 rounded-full bg-white/20" />
            <span className="text-sm">LegitScript &amp; NABP accredited</span>
          </motion.div>
        </section>

        {/* Value props */}
        <section className="grid gap-5 sm:grid-cols-3">
          {VALUE_PROPS.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              className="rounded-2xl border border-white/10 bg-white/3 p-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-magenta/15 text-magenta-light">
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                >
                  {p.icon}
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">
                {p.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                {p.body}
              </p>
            </motion.div>
          ))}
        </section>

        {/* How it works */}
        <section className="mt-24">
          <div className="text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">
              How it works
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-white/50">
              From application to your first engagement in three simple steps.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="relative rounded-2xl border border-white/10 bg-white/3 p-7"
              >
                <span className="text-sm font-semibold tracking-widest text-magenta-light">
                  {s.n}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-white">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">
                  {s.body}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="mt-24">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-linear-to-br from-navy-light/40 to-magenta-dark/30 px-8 py-14 text-center">
            <h2 className="text-2xl font-bold sm:text-3xl">
              Ready to partner with Logos RX?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-white/60">
              Join our marketing partner program and provide brand-support
              services under a clear, compliant agreement.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/partners/apply"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-magenta to-magenta-dark px-8 text-[15px] font-semibold text-white shadow-[0_0_24px_rgba(198,46,136,0.3)] transition-all hover:shadow-[0_0_32px_rgba(198,46,136,0.5)]"
              >
                Apply now
              </Link>
              <Link
                href="/partners/sign-in"
                className="text-sm font-medium text-white/70 transition-colors hover:text-white"
              >
                Already a partner? Sign in →
              </Link>
            </div>
          </div>
        </section>

        {/* Compliance disclaimer — keep in sync with the executed MSA */}
        <p className="mx-auto mt-16 max-w-3xl text-center text-[11px] leading-relaxed text-white/30">
          Compensation under the Logos RX marketing partner program is a fixed,
          fair-market-value fee for bona fide marketing services. It does not
          vary with, and is not determined by, the volume or value of any
          business, prescriptions, orders, or referrals generated. Partners do
          not dispense, recommend, or direct any specific prescription, and all
          engagements are governed by a written Marketing Services Agreement
          intended to comply with applicable federal and state healthcare laws.
        </p>

        {/* Footer */}
        <footer className="mt-12 flex flex-col items-center gap-4 border-t border-white/10 pt-8 text-center">
          <div className="flex items-center gap-6 text-white/25">
            <span className="flex items-center gap-1.5 text-[11px] tracking-wide">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="6" width="8" height="6" rx="1.5" strokeLinecap="round" />
                <path d="M4.5 6V4.5a2.5 2.5 0 015 0V6" strokeLinecap="round" />
              </svg>
              Encrypted
            </span>
            <span className="flex items-center gap-1.5 text-[11px] tracking-wide">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M7 1L2 3.5v3c0 3.5 2.1 5.5 5 7 2.9-1.5 5-3.5 5-7v-3L7 1z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              HIPAA Compliant
            </span>
            <span className="flex items-center gap-1.5 text-[11px] tracking-wide">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="7" cy="7" r="5.5" />
                <path d="M4.5 7l1.5 1.5L9.5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              SOC 2
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-[11px] text-white/20 transition-colors hover:text-white/75">
              logosrx.com
            </Link>
            <span className="text-[11px] text-white/10">&bull;</span>
            <span className="text-[11px] text-white/20">
              &copy; {new Date().getFullYear()} Logos RX
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
