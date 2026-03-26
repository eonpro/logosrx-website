"use client";

import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Provider Prescribes",
    description:
      "Your healthcare provider writes a prescription tailored to your specific needs.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M16 4C9.37 4 4 9.37 4 16s5.37 12 12 12 12-5.37 12-12S22.63 4 16 4Z" stroke="currentColor" strokeWidth="2" />
        <path d="M12 16h8M16 12v8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "We Compound",
    description:
      "Our pharmacists craft your medication in our state-of-the-art sterile and non-sterile labs.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M13 4v8l-6 12a2 2 0 0 0 1.8 2.9h14.4A2 2 0 0 0 25 24L19 12V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 4h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M9 20h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Delivered to You",
    description:
      "Your personalized medication is shipped directly to you or your provider's office.",
    icon: (
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
        <path d="M4 18h2l3-8h14l3 8h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="10" cy="24" r="3" stroke="currentColor" strokeWidth="2" />
        <circle cx="22" cy="24" r="3" stroke="currentColor" strokeWidth="2" />
        <path d="M13 24h6M7 24H4v-6M28 24h-3M28 18v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function HowItWorks() {
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
            Simple Process
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-navy">
            How It Works
          </h2>
        </motion.div>

        <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-0">
          {/* Connecting line — desktop only */}
          <div className="hidden lg:block absolute top-16 left-[16.67%] right-[16.67%] h-px bg-beige-dark" />

          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative flex flex-col items-center text-center px-6"
            >
              <div className="relative z-10 w-32 h-32 rounded-full bg-white shadow-lg shadow-navy/5 flex items-center justify-center mb-8 text-magenta">
                {step.icon}
              </div>

              <span className="text-xs font-bold tracking-[0.3em] uppercase text-magenta/60 mb-2">
                {step.number}
              </span>
              <h3 className="text-xl font-bold text-navy mb-3">{step.title}</h3>
              <p className="text-sm leading-relaxed text-navy/60 max-w-xs">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
