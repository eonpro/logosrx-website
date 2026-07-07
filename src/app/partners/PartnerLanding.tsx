"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { displayFont } from "@/lib/fonts";

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
 * Styling intentionally mirrors `AuthShell` (minimal light "ink" theme) so
 * the funnel — landing → apply/sign-in — feels continuous.
 */

const VALUE_PROPS = [
  {
    title: "Simple, set compensation",
    body: "You're paid a set fee for the marketing services you provide — clear and predictable.",
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
    body: "Collaborate with our team on brand development, advertising, content, and audience promotion for the pharmacy.",
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
    title: "A clear agreement",
    body: "Every engagement is covered by a straightforward Marketing Services Agreement.",
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
    body: "We review your application and set up a Marketing Services Agreement covering the scope of work and your fee.",
  },
  {
    n: "03",
    title: "Deliver & get paid",
    body: "Provide the agreed marketing and brand-support services and get paid for your work.",
  },
];

export default function PartnerLanding() {
  return (
    <div className={`theme-ink ${displayFont.variable} relative min-h-screen bg-cream text-navy`}>
      <div className="relative z-10 mx-auto flex max-w-6xl flex-col px-6 py-10 sm:py-14">
        {/* Top bar */}
        <header className="flex items-center justify-between">
          <Link href="/" aria-label="Logos RX home">
            <Image
              src="/images/logo.svg"
              alt="Logos RX"
              width={150}
              height={48}
              className="h-9 w-auto"
              priority
            />
          </Link>
          <Link
            href="/partners/sign-in"
            className="text-sm font-medium text-navy/60 transition-colors hover:text-navy"
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
            className="text-[11px] font-medium uppercase tracking-[0.25em] text-magenta"
          >
            Marketing Partner Program
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="font-display mt-5 max-w-3xl text-5xl font-medium leading-[1.02] sm:text-7xl"
          >
            Work with{" "}
            <span className="text-magenta">Logos RX</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-6 max-w-xl text-lg text-navy/60"
          >
            Partner with a multi-state licensed 503A compounding pharmacy to
            provide marketing and brand-support services.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
          >
            <Link
              href="/partners/apply"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-magenta px-8 text-[15px] font-semibold text-white transition-colors hover:bg-magenta-dark"
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
              className="inline-flex h-12 items-center justify-center rounded-xl border border-beige-dark bg-white px-8 text-[15px] font-semibold text-navy transition-colors hover:border-navy/30 hover:bg-cream"
            >
              Partner sign in
            </Link>
          </motion.div>

          {/* Trust strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-navy/50"
          >
            <span className="text-sm">
              <span className="font-semibold text-navy">5,000+</span>{" "}
              providers
            </span>
            <span className="h-1 w-1 rounded-full bg-navy/20" />
            <span className="text-sm">
              <span className="font-semibold text-navy">Multi-state</span>{" "}
              licensed
            </span>
            <span className="h-1 w-1 rounded-full bg-navy/20" />
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
              className="rounded-2xl border border-beige bg-white p-6"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-magenta/10 text-magenta">
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
              <h3 className="mt-4 text-lg font-semibold text-navy">
                {p.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-navy/60">
                {p.body}
              </p>
            </motion.div>
          ))}
        </section>

        {/* How it works */}
        <section className="mt-24">
          <div className="text-center">
            <h2 className="font-display text-3xl font-medium sm:text-4xl">
              How it works
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-navy/60">
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
                className="relative rounded-2xl border border-beige bg-white p-7"
              >
                <span className="text-sm font-semibold tracking-widest text-magenta">
                  {s.n}
                </span>
                <h3 className="mt-3 text-lg font-semibold text-navy">
                  {s.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-navy/60">
                  {s.body}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="mt-24">
          <div className="relative overflow-hidden rounded-3xl bg-navy px-8 py-14 text-center text-white">
            <h2 className="font-display text-3xl font-medium sm:text-4xl">
              Ready to partner with Logos RX?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-white/70">
              Join our marketing partner program and provide brand-support
              services for the pharmacy.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/partners/apply"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-8 text-[15px] font-semibold text-navy transition-colors hover:bg-white/90"
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

        {/* Footer */}
        <footer className="mt-16 flex flex-col items-center gap-4 border-t border-beige pt-8 text-center">
          <div className="flex items-center gap-6 text-navy/40">
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
            <Link href="/" className="text-[11px] text-navy/40 transition-colors hover:text-navy">
              logosrx.com
            </Link>
            <span className="text-[11px] text-navy/20">&bull;</span>
            <span className="text-[11px] text-navy/40">
              &copy; {new Date().getFullYear()} Logos RX
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
