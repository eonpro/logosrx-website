"use client";

import { motion } from "framer-motion";
import { SITE } from "@/lib/constants";

export default function BuildingTrust() {
  return (
    <section id="about" className="relative overflow-hidden" data-header-theme="dark">
      {/* Dark overlay background */}
      <div className="absolute inset-0 bg-navy-deep" />
      <div className="absolute inset-0 bg-gradient-to-br from-navy/90 via-navy-deep/95 to-navy" />
      {/* Decorative grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8 py-28 sm:py-36 lg:py-44">
        <div className="max-w-3xl">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-4xl sm:text-5xl lg:text-6xl text-white leading-tight"
          >
            Building Trust
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-6 text-lg sm:text-xl leading-relaxed text-white/70 max-w-2xl"
          >
            We&rsquo;re dedicated to improving patient outcomes through personalized
            compounding and uniting healthcare professionals across the nation in
            collaborative care.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10"
          >
            <a
              href="#services"
              className="inline-flex items-center gap-3 rounded-full border-2 border-white/30 bg-magenta px-8 py-4 text-sm font-semibold uppercase tracking-wide text-white hover:bg-magenta-dark hover:border-white/50 transition-all duration-300"
            >
              About {SITE.name}
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M3 1.5L9 6L3 10.5V1.5Z" fill="currentColor" />
              </svg>
            </a>
          </motion.div>
        </div>

        {/* Decorative geometric shapes */}
        <div className="absolute bottom-0 right-0 w-64 h-64 lg:w-96 lg:h-96">
          <div className="absolute bottom-8 right-8 w-32 h-32 lg:w-48 lg:h-48 rounded-3xl bg-sky/10 rotate-12 blur-sm" />
          <div className="absolute bottom-16 right-24 w-24 h-24 lg:w-36 lg:h-36 rounded-2xl bg-sky/15 -rotate-6" />
          <div className="absolute bottom-4 right-4 w-16 h-16 lg:w-24 lg:h-24 rounded-xl bg-magenta/10 rotate-45" />
        </div>
      </div>
    </section>
  );
}
