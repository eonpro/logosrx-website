"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { SITE } from "@/lib/constants";

export default function Testimonial() {
  return (
    <section className="relative bg-navy-deep overflow-hidden" data-header-theme="dark">
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
            <div className="mb-8">
              <Image
                src="/images/logos-icon-testimonial.png"
                alt="Logos RX"
                width={96}
                height={96}
                className="w-24 h-24 object-contain"
              />
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
            <div className="flex items-center gap-5">
              <Image
                src="/images/gavin-sigle.png"
                alt="Gavin Sigle, MD"
                width={56}
                height={56}
                className="shrink-0 w-14 h-14 rounded-full object-contain"
              />

              <div>
                <h3 className="text-lg font-semibold text-white">Gavin Sigle, MD</h3>
                <p className="text-sm text-sky font-medium tracking-wide uppercase">
                  Medical Director, EONMEDS
                </p>
              </div>
            </div>

            <blockquote className="mt-8 text-lg sm:text-xl leading-relaxed text-white/90">
              &ldquo;Logos Rx makes my job easier every day. Their team actually cares
              about both the provider and the patient&mdash;that&rsquo;s rare to find.&rdquo;
            </blockquote>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
