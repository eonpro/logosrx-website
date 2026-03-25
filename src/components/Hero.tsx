"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { SITE } from "@/lib/constants";

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#f2f0eb] to-[#b9b7b2]">
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

            <div className="flex items-center gap-3 mt-10">
              <Image
                src="/images/trusted-providers.webp"
                alt="Trusted by 5,000+ providers"
                width={240}
                height={48}
                className="h-12 w-auto"
              />
            </div>
          </motion.div>

          {/* Right image */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="relative flex items-center justify-center"
          >
            <Image
              src="/images/hand-vial.webp"
              alt="Hand holding a Logos RX NAD+ vial"
              width={600}
              height={800}
              priority
              className="w-full max-w-lg h-auto object-contain"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
