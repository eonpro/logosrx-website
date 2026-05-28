import type { Product } from "@/data/products";
import Reveal from "../Reveal";

interface ProductIngredientsProps {
  product: Product;
}

export default function ProductIngredients({ product }: ProductIngredientsProps) {
  const highlights = product.ingredientHighlights ?? [];
  const hasParagraphs =
    (product.descriptionParagraphs?.length ?? 0) > 0 || Boolean(product.description);

  if (!highlights.length && !hasParagraphs) return null;

  return (
    <section className="bg-cream py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-magenta mb-4">
            About the ingredient
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-navy leading-[1.1] max-w-3xl">
            {product.activeIngredient.name}
          </h2>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-navy/70">
            {product.activeIngredient.description}
          </p>
        </Reveal>

        {hasParagraphs ? (
          <Reveal delay={80} className="mt-12 grid gap-6 max-w-3xl">
            {(product.descriptionParagraphs ?? [product.description]).map((p, i) => (
              <p key={i} className="text-base leading-[1.8] text-navy/65">
                {p}
              </p>
            ))}
          </Reveal>
        ) : null}

        {highlights.length > 0 ? (
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {highlights.map((h, i) => (
              <Reveal key={h.title} delay={i * 80}>
                <div className="h-full rounded-3xl bg-white p-7 shadow-sm border border-beige/60 hover:border-magenta/40 transition-colors">
                  <div className="flex items-center justify-center w-11 h-11 rounded-full bg-magenta/10 text-magenta mb-5">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path
                        d="M6 10l3 3 5-6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-navy mb-3 leading-snug">
                    {h.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-navy/65">
                    {h.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
