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
      className="group relative flex flex-col rounded-3xl bg-cream overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-navy/10"
    >
      {product.badge && (
        <span className="absolute top-4 right-4 z-10 rounded-full bg-magenta px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
          {product.badge}
        </span>
      )}

      {/* Image area */}
      <div className="relative h-72 overflow-hidden bg-beige transition-colors duration-500 group-hover:bg-beige-dark">
        <div className="absolute inset-0 flex items-center justify-center">
          {hasImage ? (
            <div className="relative transition-transform duration-500 ease-out group-hover:scale-110">
              <Image
                src={product.image}
                alt={product.name}
                width={280}
                height={280}
                className="relative z-10 h-56 w-auto object-contain drop-shadow-lg"
              />
              {/* Floating shadow */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/5 h-4 rounded-[50%] bg-black/15 blur-md transition-all duration-500 group-hover:w-4/5 group-hover:bg-black/20 group-hover:blur-lg" />
            </div>
          ) : (
            <div className="relative transition-transform duration-500 ease-out group-hover:scale-110">
              <VialPlaceholder name={product.name} />
              {/* Floating shadow */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/5 h-4 rounded-[50%] bg-black/15 blur-md transition-all duration-500 group-hover:w-4/5 group-hover:bg-black/20 group-hover:blur-lg" />
            </div>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="flex flex-col gap-2 p-6">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-navy/30">
          {product.category}
        </p>
        <h3 className="text-lg font-bold text-navy transition-colors duration-300 group-hover:text-magenta">
          {product.name}
        </h3>
        <div className="flex items-center gap-3 text-sm text-navy/50">
          <span>{product.concentration}</span>
          <span className="w-1 h-1 rounded-full bg-navy/20" />
          <span>{product.form}</span>
          <span className="w-1 h-1 rounded-full bg-navy/20" />
          <span>{product.size}</span>
        </div>
      </div>
    </Link>
  );
}
