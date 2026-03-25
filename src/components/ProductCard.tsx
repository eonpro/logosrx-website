import Link from "next/link";
import type { Product } from "@/data/products";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative flex flex-col rounded-2xl bg-cream p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-navy/5"
    >
      {product.badge && (
        <span className="absolute top-4 right-4 z-10 rounded-full bg-magenta px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
          {product.badge}
        </span>
      )}

      {/* Category label */}
      <p className="text-[10px] font-semibold uppercase tracking-widest text-navy/30 mb-4">
        {product.category}
      </p>

      {/* Product vial */}
      <div className="flex items-center justify-center py-6">
        <div className="relative w-16 h-40 rounded-lg bg-gradient-to-b from-magenta/80 via-magenta-dark/70 to-navy-deep/80 shadow-md group-hover:shadow-lg transition-shadow duration-300 flex flex-col items-center">
          <div className="w-7 h-4 rounded-t-md bg-magenta-light mt-[-1px]" />
          <div className="flex-1 w-[calc(100%-6px)] rounded-b-md bg-white/10 backdrop-blur-sm mt-1 flex items-center justify-center">
            <div className="text-center text-white/80">
              <p className="text-[6px] font-bold tracking-wider uppercase">Logos RX</p>
              <p className="text-[4px] mt-0.5 opacity-70">{product.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Product info */}
      <h3 className="text-base font-bold text-navy group-hover:text-magenta transition-colors duration-300 mb-3">
        {product.name} {product.size}
      </h3>

      <ul className="space-y-1.5">
        <li className="flex items-center gap-2 text-sm text-navy/50">
          <span className="w-1 h-1 rounded-full bg-navy/30 flex-shrink-0" />
          {product.concentration}
        </li>
        <li className="flex items-center gap-2 text-sm text-navy/50">
          <span className="w-1 h-1 rounded-full bg-navy/30 flex-shrink-0" />
          {product.form}
        </li>
      </ul>
    </Link>
  );
}
