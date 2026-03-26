"use client";

import { motion } from "framer-motion";
import CollapsibleSection from "./CollapsibleSection";

const faqs = [
  {
    label: "What is a compounding pharmacy?",
    content:
      "A compounding pharmacy creates personalized medications tailored to individual patient needs. Unlike mass-produced drugs, compounded medications can be customized in dosage, form, and ingredients — allowing providers to prescribe exactly what their patients need.",
  },
  {
    label: "Do I need a prescription?",
    content:
      "Yes, all compounded medications require a valid prescription from a licensed healthcare provider. If you're a patient looking for a prescribing provider, contact us and we'll help connect you with one in your area.",
  },
  {
    label: "What states do you serve?",
    content:
      "Logos RX is a multi-state licensed 503A compounding pharmacy currently serving providers and patients in over 25 states across the U.S., with more states coming soon. Contact us to confirm availability in your state.",
  },
  {
    label: "Does insurance cover compounded medications?",
    content:
      "Coverage varies by insurance plan. Some plans cover compounded medications, while others may not. However, many compounded medications are competitively priced and may be more affordable than commercial alternatives even without insurance coverage.",
  },
  {
    label: "How fast is shipping?",
    content:
      "We offer fast, reliable shipping nationwide. Most orders are compounded and shipped within 24–48 hours of receiving the prescription. Expedited shipping options are also available for time-sensitive medications.",
  },
  {
    label: "What quality standards do you follow?",
    content:
      "Logos RX adheres to the highest compounding standards, including USP 795, 797, and 800 guidelines. Our sterile and non-sterile compounding labs undergo regular third-party testing and audits to ensure potency, sterility, and safety of every formulation.",
  },
  {
    label: "How do I become a prescribing provider?",
    content:
      "Getting started is simple. Visit our provider onboarding portal to create an account. Our team will guide you through the setup process, and you can start prescribing compounded medications for your patients right away.",
  },
];

export default function FAQ() {
  return (
    <section className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Left — heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase text-magenta mb-3">
              FAQ
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-navy leading-tight mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-navy/60 leading-relaxed">
              Have a question not listed here? Reach out to our team — we&rsquo;re
              here to help providers and patients alike.
            </p>
          </motion.div>

          {/* Right — accordion */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {faqs.map((faq, i) => (
              <CollapsibleSection
                key={i}
                label={faq.label}
                content={faq.content}
                defaultOpen={i === 0}
              />
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
