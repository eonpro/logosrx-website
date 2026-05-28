"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { AnimatePresence, motion } from "framer-motion";
import {
  countActiveFilters,
  type CatalogFilters,
  type FilterGroupKey,
} from "@/data/catalog";
import CatalogFiltersSidebar from "./CatalogFiltersSidebar";

interface CatalogMobileFiltersProps {
  filters: CatalogFilters;
  counts: Record<FilterGroupKey, Record<string, number>>;
}

/**
 * Mobile-only filter sheet (rendered only `<lg`). Opens a bottom sheet via
 * Radix Dialog (focus trap + escape + scroll lock are handled by the
 * primitive). The filter UI itself is the same server-rendered
 * `CatalogFiltersSidebar` — so changes to filter behavior land in one place.
 */
export default function CatalogMobileFilters({
  filters,
  counts,
}: CatalogMobileFiltersProps) {
  const [open, setOpen] = useState(false);
  const activeCount = countActiveFilters(filters);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border border-beige bg-white px-4 py-2 text-sm font-semibold text-navy hover:border-navy/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-magenta lg:hidden"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path
            d="M1.5 3.5h11M3 7h8M5 10.5h4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        Filters
        {activeCount > 0 && (
          <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-magenta px-1.5 text-[11px] font-bold text-white">
            {activeCount}
          </span>
        )}
      </Dialog.Trigger>

      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                key="catalog-filters-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 z-50 bg-black/50"
              />
            </Dialog.Overlay>

            {/*
             * Bottom sheet — slides up from the bottom edge the way a native
             * iOS / Android sheet does. Capped at 88svh so the list peeks
             * behind it (preserves spatial context) and the user can still
             * tap the dimmed backdrop to dismiss. `svh` keeps the sheet from
             * jumping when the mobile URL bar shows/hides.
             */}
            <Dialog.Content asChild>
              <motion.div
                key="catalog-filters-panel"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "tween", duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                className="safe-pb fixed inset-x-0 bottom-0 z-50 flex max-h-[88svh] flex-col rounded-t-3xl bg-white shadow-2xl focus:outline-none"
                data-lenis-prevent
              >
                {/* Grabber handle */}
                <div className="flex justify-center pt-3 pb-1">
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-10 rounded-full bg-beige-dark"
                  />
                </div>

                <div className="flex shrink-0 items-center justify-between px-6 pb-4 pt-2">
                  <Dialog.Title className="text-base font-bold text-navy">
                    Filters{activeCount > 0 ? ` (${activeCount})` : ""}
                  </Dialog.Title>
                  <Dialog.Description className="sr-only">
                    Narrow the catalog by product family, brand, therapeutic area, or dosage form.
                  </Dialog.Description>
                  <Dialog.Close
                    className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-beige/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-magenta transition-colors"
                    aria-label="Close filters"
                  >
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                      <path
                        d="M5 5L15 15M15 5L5 15"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                    </svg>
                  </Dialog.Close>
                </div>

                <div className="flex-1 overflow-y-auto overscroll-contain border-t border-beige px-6 py-2">
                  <CatalogFiltersSidebar
                    filters={filters}
                    counts={counts}
                    idSuffix="mobile"
                    hideHeader
                  />
                </div>

                <div className="shrink-0 border-t border-beige p-4">
                  <Dialog.Close
                    className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-magenta px-6 py-3 text-sm font-semibold text-white hover:bg-magenta-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-magenta transition-colors"
                  >
                    Show results
                  </Dialog.Close>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
