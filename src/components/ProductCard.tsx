import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/data/products";

interface ProductCardProps {
  product: Product;
}

function VialPlaceholder({ name }: { name: string }) {
  return (
    <div className="relative w-16 h-40 rounded-lg bg-gradient-to-b from-magenta/80 via-purple-deep/70 to-navy-deep/90 flex flex-col items-center shadow-lg">
      <div className="w-7 h-4 rounded-t-md bg-magenta-light/80 -mt-px" />
      <div className="flex-1 w-[calc(100%-6px)] rounded-b-md bg-white/10 backdrop-blur-sm mt-1 flex items-center justify-center">
        <div className="text-center text-white/80">
          <p className="text-[7px] font-bold tracking-wider uppercase">
            Logos RX
          </p>
          <p className="text-[5px] mt-0.5 opacity-60">{name}</p>
        </div>
      </div>
    </div>
  );
}

export default function ProductCard({ product }: ProductCardProps) {
  const hasImage = !!product.image;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative flex flex-col rounded-2xl bg-beige overflow-hidden transition-all duration-500 ease-out hover:bg-beige-dark"
    >
      {product.badge && (
        <span className="absolute top-4 left-4 z-10 rounded-full bg-magenta px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
          {product.badge}
        </span>
      )}

      {/* Image area — product floating in center */}
      <div className="relative h-72 flex items-center justify-center">
        {hasImage ? (
          <div className="relative transition-all duration-500 ease-out group-hover:scale-[1.08] group-hover:-translate-y-1.5">
            <Image
              src={product.image}
              alt={product.name}
              width={200}
              height={200}
              className="relative z-10 h-44 w-auto object-contain"
            />
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-24 h-5 rounded-[50%] bg-black/15 blur-xl transition-all duration-500 ease-out group-hover:w-32 group-hover:bg-black/20 group-hover:blur-2xl" />
          </div>
        ) : (
          <div className="relative transition-all duration-500 ease-out group-hover:scale-[1.08] group-hover:-translate-y-1.5">
            <VialPlaceholder name={product.name} />
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-20 h-5 rounded-[50%] bg-black/15 blur-xl transition-all duration-500 ease-out group-hover:w-28 group-hover:bg-black/20 group-hover:blur-2xl" />
          </div>
        )}
      </div>

      {/* Info — inside the same card, no separator */}
      <div className="px-5 pb-5 pt-0">
        <h3 className="text-lg font-bold text-navy leading-snug">
          {product.name}
        </h3>
        <p className="text-[13px] text-navy/40 mt-0.5">
          {product.activeIngredient.name.split("(")[0].trim()}
        </p>
        <p className="text-[12px] text-navy/25 mt-1.5">
          {product.concentration} · {product.form} · {product.size}
        </p>
      </div>
    </Link>
  );
}
