import type { Product } from "@/data/products";
import CollapsibleSection from "../CollapsibleSection";
import Reveal from "../Reveal";

interface ProductFAQProps {
  product: Product;
}

export default function ProductFAQ({ product }: ProductFAQProps) {
  const faqs = product.faqs ?? [];
  if (faqs.length === 0) return null;

  return (
    <section className="bg-cream py-20 sm:py-28">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <Reveal>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-magenta mb-4 text-center">
            FAQ
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-navy leading-[1.15] text-center">
            Frequently asked questions
          </h2>
        </Reveal>

        <Reveal delay={80} className="mt-12 rounded-3xl border border-beige/70 bg-white px-6 sm:px-8">
          {faqs.map((f) => (
            <CollapsibleSection
              key={f.q}
              label={f.q}
              content={f.a}
              tone="question"
            />
          ))}
        </Reveal>
      </div>
    </section>
  );
}
