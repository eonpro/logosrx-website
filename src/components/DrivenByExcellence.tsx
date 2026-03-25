"use client";

import { motion } from "framer-motion";

export default function DrivenByExcellence() {
  return (
    <section id="services" className="bg-white py-24 sm:py-32 overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-gradient-to-br from-navy-light to-navy-deep"
          >
            {/* Stylized lab environment */}
            <div className="absolute inset-0 bg-gradient-to-br from-navy via-navy-light to-navy-deep">
              {/* Abstract lab visuals */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="grid grid-cols-3 gap-4 p-8 opacity-30">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="w-16 h-16 rounded-lg bg-white/10 backdrop-blur-sm" />
                  ))}
                </div>
              </div>
              <div className="absolute bottom-6 left-6 right-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-magenta/30" />
                <div className="w-10 h-10 rounded-full bg-sky/30" />
                <div className="w-10 h-10 rounded-full bg-magenta/20" />
                <div className="flex-1 h-1 rounded-full bg-white/10" />
              </div>
              <div className="absolute top-6 right-6">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="opacity-20">
                  <path d="M20 2L36 34H4L20 2Z" fill="white" />
                </svg>
              </div>
            </div>
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl text-navy leading-tight mb-6">
              Driven by Excellence
            </h2>
            <p className="text-lg leading-relaxed text-navy/60">
              Quality is more than a measure&mdash;it&rsquo;s our foundation. Every process,
              innovation, and detail is designed to ensure precision, safety, and
              reliability. We&rsquo;re committed to empowering providers and improving
              patient outcomes through unwavering excellence in everything we create.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
