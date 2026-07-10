"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import ProductCard from "./ProductCard";
import VialLoop from "./VialLoop";
import { getPublicFeaturedProducts } from "@/data/products";
import { SITE } from "@/lib/constants";

const featured = getPublicFeaturedProducts();

export default function FeaturedProducts() {
  return (
    <section id="products" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-2xl mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-navy"
          >
            Our Products
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-lg text-navy/65"
          >
            A look at a few of our most-requested compounded medications. Our
            full catalog and provider pricing unlock once your clinic account
            is approved.
          </motion.p>
        </div>

        {/* Featured product grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {featured.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </motion.div>

        {/* Locked catalog CTA — routes into clinic account creation */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="relative mt-14 overflow-hidden rounded-3xl bg-navy px-6 py-12 sm:px-12 sm:py-14"
        >
          {/* Ambient glow accents */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-magenta/25 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-sky/20 blur-3xl"
          />

          <div className="relative grid items-center gap-10 lg:grid-cols-[1.3fr_auto_1fr]">
            {/* Left: messaging */}
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/80">
                <LockIcon className="h-3.5 w-3.5" />
                Verified clinics only
              </span>

              <h3 className="mt-5 text-2xl font-bold leading-tight text-white sm:text-3xl">
                Custom provider pricing,
                <br className="hidden sm:block" /> unlocked for your clinic
              </h3>

              <p className="mt-4 max-w-xl text-base leading-relaxed text-white/70">
                The complete Logos RX catalog—with provider pricing—is reserved
                for verified clinics. Create an account to request access and
                see pricing tailored to your practice.
              </p>

              <ul className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-x-6">
                {[
                  "Full compounded medication catalog",
                  "Negotiated provider pricing",
                  "Fast clinic verification",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-sm text-white/75"
                  >
                    <CheckIcon className="h-4 w-4 flex-none text-magenta-light" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Center: rotating compounded vial (alpha frames over the navy panel) */}
            <div className="pointer-events-none flex select-none justify-center">
              <div className="relative">
                <div
                  aria-hidden
                  className="absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky/15 blur-2xl lg:h-56 lg:w-56"
                />
                <VialLoop className="relative h-56 w-auto drop-shadow-[0_18px_30px_rgba(0,0,0,0.45)] lg:h-72" />
              </div>
            </div>

            {/* Right: action */}
            <div className="flex flex-col items-start gap-4 lg:items-end">
              <Link
                href={SITE.onboarding}
                className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-magenta px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-magenta/30 transition-all hover:bg-magenta-dark hover:shadow-magenta/40 sm:w-auto"
              >
                Create account &amp; view pricing
                <ArrowIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <p className="text-xs text-white/50 lg:text-right">
                Already verified?{" "}
                <Link
                  href="/sign-in"
                  className="font-medium text-white/80 underline-offset-4 hover:text-white hover:underline"
                >
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function ArrowIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
