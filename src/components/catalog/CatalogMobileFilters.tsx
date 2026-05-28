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
 * Mobile-only filter drawer (rendered only `<lg`). Opens a right-side sheet
 * via Radix Dialog (focus trap + escape + scroll lock are handled by the
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
        className="inline-flex items-center gap-2 rounded-full border border-beige bg-white px-4 py-2 text-sm font-semibold text-navy hover:border-navy/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-magenta lg:hidden"
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
                transition={{ duration: 0.15 }}
                className="fixed inset-0 z-50 bg-black/50"
              />
            </Dialog.Overlay>

            <Dialog.Content asChild>
              <motion.div
                key="catalog-filters-panel"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "tween", duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
                className="fixed top-0 right-0 bottom-0 z-50 flex w-full max-w-md flex-col bg-white shadow-2xl focus:outline-none"
                data-lenis-prevent
              >
                <div className="flex shrink-0 items-center justify-between border-b border-beige p-6">
                  <Dialog.Title className="text-sm font-bold uppercase tracking-[0.15em] text-navy">
                    Filters{activeCount > 0 ? ` (${activeCount})` : ""}
                  </Dialog.Title>
                  <Dialog.Description className="sr-only">
                    Narrow the catalog by product family, brand, therapeutic area, or dosage form.
                  </Dialog.Description>
                  <Dialog.Close
                    className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-beige/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-magenta transition-colors"
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

                <div className="flex-1 overflow-y-auto overscroll-contain px-6 py-2">
                  <CatalogFiltersSidebar
                    filters={filters}
                    counts={counts}
                    idSuffix="mobile"
                    hideHeader
                  />
                </div>

                <div className="shrink-0 border-t border-beige p-4">
                  <Dialog.Close
                    className="inline-flex w-full items-center justify-center rounded-full bg-magenta px-6 py-3 text-sm font-semibold text-white hover:bg-magenta-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-magenta transition-colors"
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
