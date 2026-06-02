"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import ProductCard from "./ProductCard";
import { getPublicFeaturedProducts } from "@/data/products";
import { SITE } from "@/lib/constants";

const featured = getPublicFeaturedProducts();

export default function FeaturedProducts() {
  return (
    <section id="products" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-2xl mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-navy"
          >
            Our Products
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-4 text-lg text-navy/65"
          >
            A look at a few of our most-requested compounded medications. Our
            full catalog and provider pricing unlock once your clinic account
            is approved.
          </motion.p>
        </div>

        {/* Featured product grid */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
        >
          {featured.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </motion.div>

        {/* View full catalog CTA — routes into clinic account creation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
          className="mt-12 flex flex-col items-center gap-4 rounded-2xl bg-beige px-6 py-10 text-center"
        >
          <p className="max-w-xl text-base text-navy/70">
            The complete Logos RX catalog—with provider pricing—is reserved for
            verified clinics. Create an account to request access.
          </p>
          <Link
            href={SITE.onboarding}
            className="inline-flex items-center gap-2 rounded-full bg-magenta px-8 py-3 text-sm font-semibold text-white hover:bg-magenta/90 transition-colors"
          >
            View Full Catalog
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
