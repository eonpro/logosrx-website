"use client";

import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import { NAV_LINKS, SITE } from "@/lib/constants";
import { products } from "@/data/products";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Featured carousel: prefer products that have a real photo so the menu
 * showcases imagery rather than placeholders, then backfill with the rest
 * to keep up to six tiles.
 */
const featuredProducts = [
  ...products.filter((p) => p.image),
  ...products.filter((p) => !p.image),
].slice(0, 6);

export default function MobileMenu({ open, onClose }: MobileMenuProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                key="menu-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-50 bg-black/50"
              />
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <motion.div
                key="menu-panel"
                id="primary-mobile-menu"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "tween", duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                className="fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col focus:outline-none"
                data-lenis-prevent
              >
                <Dialog.Title className="sr-only">Site navigation</Dialog.Title>
                <Dialog.Description className="sr-only">
                  Browse featured products, primary pages, and provider sign-in links.
                </Dialog.Description>
                <div className="flex items-center justify-between p-6 border-b border-beige shrink-0">
                  <Image
                    src="/images/logo.svg"
                    alt={SITE.name}
                    width={160}
                    height={50}
                    className="h-10 w-auto"
                  />
                  <Dialog.Close
                    className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-beige/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-magenta transition-colors"
                    aria-label="Close menu"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </Dialog.Close>
                </div>

            <div className="flex-1 overflow-y-auto overscroll-contain">
              <div className="p-6">
                <p className="text-xs font-semibold tracking-widest text-magenta uppercase mb-4">
                  Featured Products
                </p>
                <div className="flex gap-3 overflow-x-auto pb-4 -mx-1 px-1">
                  {featuredProducts.map((product) => (
                    <Link
                      key={product.slug}
                      href={`/products/${product.slug}`}
                      onClick={onClose}
                      className="flex-shrink-0 w-28 rounded-xl bg-beige p-3 text-center hover:bg-beige-dark transition-colors"
                    >
                      <div className="relative w-16 h-20 mx-auto mb-2 flex items-center justify-center">
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt={product.name}
                            width={56}
                            height={72}
                            className="h-16 w-auto object-contain"
                          />
                        ) : (
                          <div
                            className="w-12 h-18 rounded-md bg-gradient-to-b from-magenta/70 via-purple-deep/60 to-navy-deep/80 shadow"
                            aria-hidden="true"
                          />
                        )}
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
                  href="https://host4.lifefile.net/logospharmacy/doctor"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full border-2 border-magenta text-magenta text-sm font-semibold hover:bg-magenta hover:text-white transition-colors"
                >
                  EXISTING PROVIDER
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M3 1.5L9 6L3 10.5V1.5Z" fill="currentColor" />
                  </svg>
                </a>

                <Link
                  href="/sign-in"
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 w-full py-3.5 rounded-full border-2 border-navy text-navy text-sm font-semibold hover:bg-navy hover:text-white transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" className="opacity-60">
                    <path d="M3 2L11 7L3 12V2Z" fill="currentColor" />
                  </svg>
                  LOG IN
                </Link>
              </div>
            </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
