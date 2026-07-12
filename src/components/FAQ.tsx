"use client";

import Reveal from "./Reveal";
import CollapsibleSection from "./CollapsibleSection";
import { homeFaqs } from "@/data/faqs";

export default function FAQ() {
  return (
    <section className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          <Reveal>
            <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase text-magenta mb-3">
              FAQ
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-medium tracking-tight text-navy leading-[1.05] mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-navy/70 leading-relaxed">
              Have a question not listed here? Reach out to our team — we&rsquo;re
              here to help providers and patients alike.
            </p>
          </Reveal>

          <Reveal delay={100}>
            {homeFaqs.map((faq, i) => (
              <CollapsibleSection
                key={i}
                label={faq.question}
                content={faq.answer}
                defaultOpen={i === 0}
              />
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  );
}
