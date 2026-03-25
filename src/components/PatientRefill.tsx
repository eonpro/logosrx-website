"use client";

import { motion } from "framer-motion";
import { SITE } from "@/lib/constants";

export default function PatientRefill() {
  return (
    <section className="bg-white py-24 sm:py-32 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl text-navy leading-tight mb-8">
              Patient Refill
            </h2>

            <a
              href={SITE.onboarding}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 rounded-full bg-magenta px-8 py-4 text-sm font-semibold uppercase tracking-wide text-white hover:bg-magenta-dark transition-all duration-300 hover:scale-[1.02]"
            >
              Refill Your Medication
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M3 1.5L9 6L3 10.5V1.5Z" fill="currentColor" />
              </svg>
            </a>
          </motion.div>

          {/* Product box placeholder */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative flex items-center justify-center"
          >
            <div className="relative w-full max-w-sm aspect-square rounded-3xl bg-gradient-to-br from-beige via-cream to-white shadow-xl flex items-center justify-center rotate-[-3deg] hover:rotate-0 transition-transform duration-500">
              {/* Product box representation */}
              <div className="w-48 h-56 rounded-2xl bg-gradient-to-br from-navy via-navy-deep to-navy-light shadow-lg flex flex-col items-center justify-center p-6 text-center">
                <svg width="32" height="32" viewBox="0 0 48 48" fill="none" className="mb-3">
                  <path d="M24 4L42 38H6L24 4Z" fill="url(#boxGrad)" opacity="0.9" />
                  <defs>
                    <linearGradient id="boxGrad" x1="6" y1="38" x2="42" y2="4">
                      <stop offset="0%" stopColor="#C9308E" />
                      <stop offset="100%" stopColor="#E84393" />
                    </linearGradient>
                  </defs>
                </svg>
                <p className="text-white text-sm font-bold tracking-wider">LOGOS RX</p>
                <p className="text-white/50 text-[10px] mt-2 leading-snug">
                  Compounding Excellence,
                  <br />
                  Personalized.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
