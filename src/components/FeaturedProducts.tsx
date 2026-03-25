"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "./ProductCard";
import { categories, getProductsByCategory } from "@/data/products";
import type { Category } from "@/data/products";

export default function FeaturedProducts() {
  const [active, setActive] = useState<Category>("All Products");
  const filtered = getProductsByCategory(active);

  return (
    <section id="products" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-navy"
          >
            Our Products
          </motion.h2>

          <a
            href="#products"
            className="inline-flex items-center gap-2 rounded-full border-2 border-magenta px-6 py-2.5 text-sm font-semibold text-magenta hover:bg-magenta hover:text-white transition-colors self-start sm:self-auto"
          >
            Browse All Products
          </a>
        </div>

        {/* Two-column: tabs + grid */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Category tabs — vertical on desktop, horizontal scroll on mobile */}
          <div className="lg:w-56 flex-shrink-0">
            <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-4 lg:pb-0 -mx-1 px-1 lg:mx-0 lg:px-0 scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActive(cat)}
                  className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
                    active === cat
                      ? "bg-magenta text-white"
                      : "text-navy/60 hover:bg-beige hover:text-navy"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product grid */}
          <div className="flex-1 min-w-0">
            {/* Active category label */}
            <p className="text-xs font-semibold uppercase tracking-widest text-navy/40 mb-6">
              {active}:
            </p>

            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5"
              >
                {filtered.map((product) => (
                  <ProductCard key={product.slug} product={product} />
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
