"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { CONTACT } from "@/lib/constants";
import { articles, articleCategories, getArticlesByCategory } from "@/data/articles";
import type { ArticleCategory } from "@/data/articles";

export default function SupportPage() {
  const [activeCategory, setActiveCategory] = useState<ArticleCategory>("All");
  const filtered = getArticlesByCategory(activeCategory);

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-b from-cream to-white py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl"
          >
            <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase text-magenta mb-3">
              Support
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-navy leading-tight mb-6">
              Support &amp; Education Center
            </h1>
            <p className="text-lg text-navy/60 leading-relaxed max-w-2xl">
              From expert pharmaceutical consultations and how-to guides to dedicated
              customer service, our support center is your go-to destination to connect
              with the Logos RX team.
            </p>
          </motion.div>

          {/* Contact card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="mt-10 inline-flex flex-col sm:flex-row gap-6 rounded-2xl bg-white p-6 sm:p-8 shadow-sm border border-beige"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-magenta/10 flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-magenta">
                  <path d="M3 3h12a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 15 15H3a1.5 1.5 0 0 1-1.5-1.5v-9A1.5 1.5 0 0 1 3 3Z" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M16.5 4.5 9 10.5 1.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-navy/40 font-medium uppercase tracking-wider">Email</p>
                <a href={CONTACT.emailHref} className="text-sm font-semibold text-navy hover:text-magenta transition-colors">
                  {CONTACT.email}
                </a>
              </div>
            </div>

            <div className="hidden sm:block w-px bg-beige" />

            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-magenta/10 flex items-center justify-center shrink-0">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="text-magenta">
                  <path d="M16.5 12.69v2.25a1.5 1.5 0 0 1-1.635 1.5A14.843 14.843 0 0 1 8.4 14.01a14.625 14.625 0 0 1-4.5-4.5A14.843 14.843 0 0 1 1.47 3.135 1.5 1.5 0 0 1 2.955 1.5H5.205a1.5 1.5 0 0 1 1.5 1.29 9.63 9.63 0 0 0 .525 2.108 1.5 1.5 0 0 1-.337 1.582l-.953.953a12 12 0 0 0 4.5 4.5l.953-.953a1.5 1.5 0 0 1 1.582-.337 9.63 9.63 0 0 0 2.108.525 1.5 1.5 0 0 1 1.417 1.522Z" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-navy/40 font-medium uppercase tracking-wider">Phone</p>
                <a href={CONTACT.phoneHref} className="text-sm font-semibold text-navy hover:text-magenta transition-colors">
                  {CONTACT.phone}
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Product Inserts */}
      <section className="bg-white py-20 sm:py-24 border-b border-beige">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-3">
              Product Inserts
            </h2>
            <p className="text-navy/60">
              Download step-by-step instructions on how to properly inject, store, and
              dispose of injectable medications.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
            {[
              {
                title: "Intramuscular Injections",
                slug: "intramuscular-injections",
                description: "Guide for IM injection technique, site selection, and safety protocols.",
                icon: (
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path d="M7 21l14-14M21 7v6M21 7h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="14" cy="14" r="12" stroke="currentColor" strokeWidth="2" />
                  </svg>
                ),
              },
              {
                title: "Subcutaneous Injections",
                slug: "subcutaneous-injections",
                description: "Guide for SubQ injection technique, site rotation, and proper disposal.",
                icon: (
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path d="M14 4v20M4 14h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="14" cy="14" r="12" stroke="currentColor" strokeWidth="2" />
                  </svg>
                ),
              },
            ].map((insert, i) => (
              <Link
                key={insert.slug}
                href={`/product-insert/${insert.slug}`}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="group flex items-start gap-5 rounded-2xl bg-cream p-6 hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-magenta shrink-0 shadow-sm">
                    {insert.icon}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-navy group-hover:text-magenta transition-colors mb-1">
                      {insert.title}
                    </h3>
                    <p className="text-sm text-navy/50 leading-relaxed">
                      {insert.description}
                    </p>
                    <span className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-magenta uppercase tracking-wider">
                      View Guide
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Articles */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-3">
              Articles &amp; Resources
            </h2>
            <p className="text-navy/60">
              Educational content on compounding, medications, and patient care.
            </p>
          </motion.div>

          {/* Category filters */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-8 -mx-1 px-1 scrollbar-hide">
            {articleCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium transition-all duration-200 ${
                  activeCategory === cat
                    ? "bg-magenta text-white"
                    : "text-navy/60 hover:bg-beige hover:text-navy"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Article grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filtered.map((article) => (
                <Link
                  key={article.slug}
                  href={`/support/${article.slug}`}
                  className="group flex flex-col rounded-2xl bg-cream p-6 hover:-translate-y-1 hover:shadow-lg hover:shadow-navy/5 transition-all duration-300"
                >
                  <span className="inline-block self-start rounded-full bg-magenta/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-magenta mb-4">
                    {article.category}
                  </span>
                  <h3 className="text-base font-bold text-navy group-hover:text-magenta transition-colors mb-3 leading-snug">
                    {article.title}
                  </h3>
                  <p className="text-sm text-navy/50 leading-relaxed line-clamp-3 mb-4">
                    {article.excerpt}
                  </p>
                  <div className="mt-auto flex items-center justify-between">
                    <time className="text-xs text-navy/30">
                      {new Date(article.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </time>
                    <span className="text-xs font-semibold text-magenta uppercase tracking-wider group-hover:underline">
                      Read More
                    </span>
                  </div>
                </Link>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </>
  );
}
