import type { Product } from "@/data/products";
import Reveal from "../Reveal";

interface ProductHowToTakeProps {
  product: Product;
}

export default function ProductHowToTake({ product }: ProductHowToTakeProps) {
  const steps = product.howToTake ?? [];
  if (steps.length === 0) return null;

  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-4">
            <Reveal>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-magenta mb-4">
                How to take
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-navy leading-[1.15]">
                A consistent routine matters.
              </h2>
              <p className="mt-5 text-base leading-relaxed text-navy/65">
                Follow the specific directions from your healthcare provider.
                These steps are a general reference for{" "}
                <span className="font-semibold text-navy">
                  {product.categoryKey.toLowerCase()}
                </span>{" "}
                administration.
              </p>
            </Reveal>
          </div>

          <div className="lg:col-span-8">
            <ol className="space-y-5">
              {steps.map((step, i) => (
                <Reveal key={step} delay={i * 60}>
                  <li className="flex items-start gap-5 rounded-2xl bg-cream/60 px-6 py-5 border border-beige/60">
                    <span className="flex shrink-0 items-center justify-center w-9 h-9 rounded-full bg-navy text-white text-sm font-bold">
                      {i + 1}
                    </span>
                    <p className="text-base leading-relaxed text-navy/80 pt-1">
                      {step}
                    </p>
                  </li>
                </Reveal>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
