"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const badges = [
  {
    title: "NABP Accredited",
    description: "National Association of Boards of Pharmacy verified",
    image: "/images/certifications/nabp.svg",
  },
  {
    title: "USP 797 Compliant",
    description: "Sterile compounding meets the highest safety standards",
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2" />
        <path d="M14 20l4 4 8-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "USP 795 Compliant",
    description: "Non-sterile compounding follows rigorous protocols",
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="2" />
        <path d="M14 20l4 4 8-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "503A Licensed",
    description: "Federally compliant compounding pharmacy across 25+ states",
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <path d="M20 4l14 8v10c0 8-6 14-14 18-8-4-14-10-14-18V12L20 4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M14 20l4 4 8-8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function Certifications() {
  return (
    <section className="bg-cream py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase text-magenta mb-3">
            Quality Assurance
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-navy">
            Certifications & Compliance
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {badges.map((badge, i) => (
            <motion.div
              key={badge.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex flex-col items-center text-center rounded-2xl bg-white p-8 shadow-sm"
            >
              <div className="w-16 h-16 flex items-center justify-center text-magenta mb-6">
                {badge.image ? (
                  <Image
                    src={badge.image}
                    alt={badge.title}
                    width={64}
                    height={64}
                    className="w-16 h-16 object-contain"
                  />
                ) : (
                  badge.icon
                )}
              </div>
              <h3 className="text-base font-bold text-navy mb-2">{badge.title}</h3>
              <p className="text-sm text-navy/50 leading-relaxed">{badge.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
