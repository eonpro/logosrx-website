"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { SITE } from "@/lib/constants";

export default function Hero() {
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const handY = useTransform(scrollYProgress, [0, 1], [0, 80]);

  return (
    <section ref={sectionRef} className="relative overflow-hidden bg-gradient-to-b from-[#f2f0eb] to-[#b9b7b2]">
      <div className="relative mx-auto max-w-7xl px-6 lg:px-8 pt-28 sm:pt-36 lg:pt-40 min-h-[85vh] sm:min-h-[80vh] lg:min-h-[85vh]">
        {/* Text column */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative z-10 max-w-[60%] sm:max-w-md lg:max-w-[45%] pb-8 sm:pb-12 lg:pb-32"
        >
          <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase text-magenta mb-3 sm:mb-4">
            {SITE.name}
          </p>

          <h1 className="text-[2rem] sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.1] tracking-tight text-navy mb-6 sm:mb-8 font-bold">
            Compounding Excellence, Personalized.
          </h1>

          <a
            href={SITE.onboarding}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 rounded-full bg-magenta px-6 sm:px-8 py-3.5 sm:py-4 text-sm font-semibold uppercase tracking-wide text-white hover:bg-magenta-dark transition-all duration-300 active:scale-95 sm:hover:scale-[1.02]"
          >
            New Provider
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 1.5L9 6L3 10.5V1.5Z" fill="currentColor" />
            </svg>
          </a>

          <div className="mt-8 sm:mt-10">
            <Image
              src="/images/trusted-providers.webp"
              alt="Provider photos"
              width={288}
              height={58}
              className="h-12 sm:h-[58px] w-auto"
            />
            <p className="mt-2 text-sm text-navy/70 font-medium">
              Trusted by <span className="font-bold text-navy">5,000+</span> providers
            </p>
          </div>
        </motion.div>

        {/* Hand image — always pinned to bottom-right with parallax */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          style={{ y: handY }}
          className="absolute bottom-0 right-0 w-[55%] sm:w-[50%] lg:w-[55%] flex justify-end items-end"
        >
          <Image
            src="/images/hand-vial.webp"
            alt="Hand holding a Logos RX NAD+ vial"
            width={600}
            height={800}
            priority
            className="w-full lg:w-[85%] xl:w-[75%] max-w-[600px] h-auto block"
          />
        </motion.div>
      </div>
    </section>
  );
}
