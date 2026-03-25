"use client";

import { motion } from "framer-motion";
import { SITE } from "@/lib/constants";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-cream via-white to-beige/30">
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <p className="text-sm font-semibold tracking-[0.2em] uppercase text-magenta mb-4">
              {SITE.name}
            </p>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.1] tracking-tight text-navy mb-8 font-bold">
              Compounding Excellence, Personalized.
            </h1>

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

            {/* Provider avatars */}
            <div className="flex items-center gap-3 mt-10">
              <div className="flex -space-x-3">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-magenta/30 to-sky/30 shadow-sm"
                  />
                ))}
              </div>
              <p className="text-sm text-navy/70 font-medium">
                Trusted by <span className="font-bold text-navy">5,000+</span> providers
              </p>
            </div>
          </motion.div>

          {/* Right image */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="relative flex items-center justify-center"
          >
            <div className="relative w-full max-w-md mx-auto aspect-[3/4] rounded-3xl bg-gradient-to-br from-beige to-beige-dark/60 overflow-hidden flex items-center justify-center shadow-xl">
              {/* Decorative gradient orb */}
              <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-gradient-to-br from-magenta/20 to-transparent blur-3xl" />
              {/* Vial placeholder */}
              <div className="relative z-10 w-24 h-52 rounded-xl bg-gradient-to-b from-magenta via-magenta-dark to-navy-deep shadow-lg flex flex-col items-center">
                <div className="w-10 h-6 rounded-t-lg bg-magenta-light mt-[-2px]" />
                <div className="flex-1 w-full rounded-b-xl bg-white/10 backdrop-blur-sm mt-2 mx-2 flex items-center justify-center">
                  <div className="text-center text-white/80">
                    <p className="text-[8px] font-bold tracking-wider uppercase">Logos RX</p>
                    <p className="text-[6px] mt-0.5 opacity-70">NAD+</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
