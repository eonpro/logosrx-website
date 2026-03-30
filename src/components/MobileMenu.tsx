"use client";

import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { NAV_LINKS, SITE } from "@/lib/constants";
import { products } from "@/data/products";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileMenu({ open, onClose }: MobileMenuProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl overflow-y-auto"
          >
            <div className="flex items-center justify-between p-6 border-b border-beige">
              <Image
                src="/images/logo.svg"
                alt={SITE.name}
                width={160}
                height={50}
                className="h-10 w-auto"
              />
              <button
                onClick={onClose}
                className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-beige/60 transition-colors"
                aria-label="Close menu"
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <p className="text-xs font-semibold tracking-widest text-magenta uppercase mb-4">
                Featured Products
              </p>
              <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1">
                {products.map((product) => (
                  <Link
                    key={product.slug}
                    href={`/products/${product.slug}`}
                    onClick={onClose}
                    className="flex-shrink-0 w-28 rounded-xl bg-beige p-3 text-center hover:bg-beige-dark transition-colors"
                  >
                    <div className="relative w-16 h-20 mx-auto mb-2">
                      <div className="w-full h-full rounded-lg bg-gradient-to-br from-magenta/20 to-magenta/5" />
                    </div>
                    <p className="text-xs font-medium text-navy truncate">{product.name}</p>
                    {product.badge && (
                      <span className="inline-block mt-1 text-[10px] font-semibold text-white bg-magenta rounded-full px-2 py-0.5">
                        {product.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>

            <nav className="px-6 pb-4">
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/"
                    onClick={onClose}
                    className="block py-3 px-3 rounded-lg text-base font-medium text-navy hover:bg-beige/60 transition-colors"
                  >
                    Home
                  </Link>
                </li>
                {NAV_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={onClose}
                      className="block py-3 px-3 rounded-lg text-base font-medium text-navy hover:bg-beige/60 transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            <div className="px-6 pb-8 space-y-3">
              <a
                href={SITE.onboarding}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full bg-magenta text-white text-sm font-semibold hover:bg-magenta-dark transition-colors"
              >
                NEW PROVIDER
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M3 1.5L9 6L3 10.5V1.5Z" fill="currentColor" />
                </svg>
              </a>

              <a
                href="/sign-in"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full border-2 border-navy text-navy text-sm font-semibold hover:bg-navy hover:text-white transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="opacity-60">
                  <path d="M3 2L11 7L3 12V2Z" fill="currentColor" />
                </svg>
                LOG IN
              </a>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
