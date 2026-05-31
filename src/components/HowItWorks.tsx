"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const steps = [
  {
    number: "1",
    title: "Provider Prescribes",
    description:
      "Your healthcare provider writes a prescription tailored to your specific needs.",
    image: "/images/how-it-works/provider.png",
    imageAlt: "Healthcare provider holding a tablet",
  },
  {
    number: "2",
    title: "We Compound",
    description:
      "Our pharmacists craft your medication in our state-of-the-art sterile and non-sterile labs.",
    image: "/images/how-it-works/compound.png",
    imageAlt: "Pharmacist compounding medication",
  },
  {
    number: "3",
    title: "We Ship It to Patient",
    description:
      "Your personalized medication is shipped directly to your patient.",
    image: "/images/how-it-works/delivery.png",
    imageAlt: "FedEx courier holding a LogosRx delivery box",
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="group relative flex flex-col overflow-hidden rounded-3xl bg-beige shadow-sm ring-1 ring-navy/5 transition-shadow hover:shadow-lg hover:shadow-navy/5"
            >
              <div className="flex flex-col items-center px-6 pt-8 text-center">
                <span className="mb-5 flex h-9 w-9 items-center justify-center rounded-full bg-navy/80 text-sm font-bold text-white">
                  {step.number}
                </span>
                <h3 className="text-xl font-bold text-navy mb-3">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-navy/60 max-w-xs">
                  {step.description}
                </p>
              </div>

              <div className="relative mt-6 flex h-64 items-end justify-center">
                <Image
                  src={step.image}
                  alt={step.imageAlt}
                  width={512}
                  height={512}
                  className="h-full w-auto object-contain object-bottom"
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
