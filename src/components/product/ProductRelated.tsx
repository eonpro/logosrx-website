import type { Product } from "@/data/products";
import ProductCard from "../ProductCard";
import Reveal from "../Reveal";

interface ProductRelatedProps {
  products: Product[];
}

export default function ProductRelated({ products }: ProductRelatedProps) {
  if (!products.length) return null;

  return (
    <section className="bg-cream py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-magenta mb-3">
            You may also be interested in
          </p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-navy leading-tight">
            Related products
          </h2>
        </Reveal>

        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {products.map((p, i) => (
            <Reveal key={p.slug} delay={i * 80}>
              <ProductCard product={p} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
