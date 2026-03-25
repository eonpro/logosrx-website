"use client";

import { motion } from "framer-motion";
import { SITE } from "@/lib/constants";

export default function Testimonial() {
  return (
    <section className="relative bg-navy-deep overflow-hidden">
      {/* Subtle pattern */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8 py-24 sm:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left — CTA */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            {/* Geometric badge */}
            <div className="mb-8 w-16 h-16 relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                  <path d="M24 4L42 38H6L24 4Z" fill="url(#testimonialGrad)" opacity="0.8" />
                  <circle cx="24" cy="28" r="8" stroke="white" strokeWidth="1.5" fill="none" opacity="0.4" />
                  <defs>
                    <linearGradient id="testimonialGrad" x1="6" y1="38" x2="42" y2="4">
                      <stop offset="0%" stopColor="#C9308E" />
                      <stop offset="100%" stopColor="#E84393" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl text-white leading-tight mb-8">
              Empowering providers,
              <br />
              transforming patient outcomes.
            </h2>

            <a
              href={SITE.onboarding}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-full bg-magenta px-8 py-4 text-sm font-semibold uppercase tracking-wide text-white hover:bg-magenta-dark transition-all duration-300 hover:scale-[1.02]"
            >
              New Provider
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M3 1.5L9 6L3 10.5V1.5Z" fill="currentColor" />
              </svg>
            </a>
          </motion.div>

          {/* Right — Quote */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative"
          >
            <div className="flex items-start gap-5">
              {/* Avatar */}
              <div className="flex-shrink-0 w-14 h-14 rounded-full bg-gradient-to-br from-magenta/40 to-sky/30 ring-2 ring-white/10" />

              <div>
                <h3 className="text-lg font-semibold text-white">Gavin Sigle, MD</h3>
                <p className="text-sm text-sky font-medium tracking-wide uppercase">
                  Medical Director, EONMEDS
                </p>
              </div>
            </div>

            <blockquote className="mt-8 text-2xl sm:text-3xl leading-relaxed text-white/90 italic">
              &ldquo;Logos Rx makes my job easier every day. Their team actually cares
              about both the provider and the patient&mdash;that&rsquo;s rare to find.&rdquo;
            </blockquote>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
