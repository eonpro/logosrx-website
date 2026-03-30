"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import type { Product } from "@/data/products";
import CollapsibleSection from "./CollapsibleSection";
import ProductCard from "./ProductCard";

interface ProductDetailProps {
  product: Product;
  relatedProducts: Product[];
}

export default function ProductDetail({ product, relatedProducts }: ProductDetailProps) {
  const hasImage = !!product.image;

  return (
    <>
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Left — Product Image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="relative aspect-square rounded-3xl bg-beige overflow-hidden flex items-center justify-center">
                {product.badge && (
                  <span className="absolute top-6 right-6 z-10 rounded-full bg-magenta px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white">
                    {product.badge}
                  </span>
                )}

                {hasImage ? (
                  <div className="relative">
                    <Image
                      src={product.image}
                      alt={product.name}
                      width={400}
                      height={400}
                      className="relative z-10 h-80 w-auto object-contain drop-shadow-xl"
                    />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/5 h-6 rounded-[50%] bg-black/15 blur-lg" />
                  </div>
                ) : (
                  <div className="relative w-28 h-56 rounded-xl bg-gradient-to-b from-magenta/80 via-purple-deep/70 to-navy-deep/90 shadow-lg flex flex-col items-center">
                    <div className="w-10 h-6 rounded-t-lg bg-magenta-light/80 -mt-px" />
                    <div className="flex-1 w-[calc(100%-10px)] rounded-b-lg bg-white/10 backdrop-blur-sm mt-2 flex items-center justify-center">
                      <div className="text-center text-white/80">
                        <p className="text-[9px] font-bold tracking-wider uppercase">Logos RX</p>
                        <p className="text-[7px] mt-0.5 opacity-70">{product.name}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Thumbnail dots */}
              <div className="flex items-center justify-center gap-2 mt-4">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full transition-colors ${
                      i === 0 ? "bg-magenta" : "bg-beige-dark"
                    }`}
                  />
                ))}
              </div>
            </motion.div>

            {/* Right — Product Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h1 className="text-3xl sm:text-4xl lg:text-5xl text-navy mb-4">
                {product.name}
              </h1>

              {product.sku && (
                <p className="text-xs text-navy/40 font-mono mb-6">SKU: {product.sku}</p>
              )}

              <p className="text-base leading-relaxed text-navy/60 mb-8">
                {product.description}
              </p>

              {/* Collapsible sections */}
              <div className="border-t border-beige">
                <CollapsibleSection
                  label="Active Ingredients"
                  content={`${product.activeIngredient.name} — ${product.activeIngredient.description}`}
                  defaultOpen
                />
                {product.details.map((detail) => (
                  <CollapsibleSection
                    key={detail.label}
                    label={detail.label}
                    content={detail.content}
                  />
                ))}
              </div>

              {/* Share */}
              <div className="mt-8 flex items-center gap-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-navy/40">
                  Share
                </span>
                <div className="flex gap-2">
                  {["facebook", "twitter", "linkedin"].map((platform) => (
                    <button
                      key={platform}
                      className="w-8 h-8 rounded-full bg-beige flex items-center justify-center text-navy/40 hover:bg-magenta hover:text-white transition-colors"
                      aria-label={`Share on ${platform}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                        <circle cx="7" cy="7" r="6" fill="none" stroke="currentColor" strokeWidth="1.2" />
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="bg-cream py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl text-navy mb-10">
              Related Products
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {relatedProducts.map((rp) => (
                <ProductCard key={rp.slug} product={rp} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
