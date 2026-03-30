import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/data/products";

interface ProductCardProps {
  product: Product;
}

function VialPlaceholder({ name }: { name: string }) {
  return (
    <div className="relative w-20 h-48 rounded-lg bg-gradient-to-b from-magenta/80 via-purple-deep/70 to-navy-deep/90 flex flex-col items-center shadow-lg">
      <div className="w-9 h-5 rounded-t-md bg-magenta-light/80 -mt-px" />
      <div className="flex-1 w-[calc(100%-8px)] rounded-b-md bg-white/10 backdrop-blur-sm mt-1 flex items-center justify-center">
        <div className="text-center text-white/80">
          <p className="text-[8px] font-bold tracking-wider uppercase">
            Logos RX
          </p>
          <p className="text-[6px] mt-0.5 opacity-60">{name}</p>
        </div>
      </div>
    </div>
  );
}

export default function ProductCard({ product }: ProductCardProps) {
  const hasImage = product.image && !product.image.endsWith(".png");

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative flex flex-col rounded-2xl overflow-hidden cursor-pointer"
    >
      {/* Image area */}
      <div className="relative h-80 overflow-hidden bg-beige transition-all duration-500 ease-out group-hover:bg-beige-dark">
        {product.badge && (
          <span className="absolute top-4 left-4 z-10 rounded-full bg-magenta px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow-lg shadow-magenta/20">
            {product.badge}
          </span>
        )}

        {/* Product image with float effect */}
        <div className="absolute inset-0 flex items-center justify-center">
          {hasImage ? (
            <div className="relative transition-transform duration-500 ease-out group-hover:scale-[1.08] group-hover:-translate-y-2">
              <Image
                src={product.image}
                alt={product.name}
                width={280}
                height={280}
                className="relative z-10 h-60 w-auto object-contain"
              />
              {/* Floating shadow — grows and softens on hover */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2/5 h-5 rounded-[50%] bg-black/12 blur-xl transition-all duration-500 ease-out group-hover:w-3/5 group-hover:h-6 group-hover:bg-black/18 group-hover:blur-2xl" />
            </div>
          ) : (
            <div className="relative transition-transform duration-500 ease-out group-hover:scale-[1.08] group-hover:-translate-y-2">
              <VialPlaceholder name={product.name} />
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2/5 h-5 rounded-[50%] bg-black/12 blur-xl transition-all duration-500 ease-out group-hover:w-3/5 group-hover:h-6 group-hover:bg-black/18 group-hover:blur-2xl" />
            </div>
          )}
        </div>
      </div>

      {/* Info — clean bottom section */}
      <div className="flex flex-col gap-1.5 px-5 py-5 bg-white transition-colors duration-500 group-hover:bg-cream">
        <h3 className="text-[17px] font-bold text-navy leading-snug">
          {product.name}
        </h3>
        <p className="text-[13px] text-navy/40 font-medium">
          {product.activeIngredient.name.split("(")[0].trim()}
        </p>
        <div className="flex items-center gap-2 mt-1 text-[12px] text-navy/30">
          <span>{product.concentration}</span>
          <span className="text-navy/15">&middot;</span>
          <span>{product.form}</span>
          <span className="text-navy/15">&middot;</span>
          <span>{product.size}</span>
        </div>
      </div>
    </Link>
  );
}
