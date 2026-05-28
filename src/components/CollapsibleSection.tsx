"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CollapsibleSectionProps {
  label: string;
  content: string;
  defaultOpen?: boolean;
  /**
   * Visual tone for the trigger label.
   *
   * - `"label"` (default): uppercase, tracked, small — for product-detail
   *   key/value labels like "Active Ingredients" or "How to Use".
   * - `"question"`: sentence-cased, larger — for FAQ rows where the trigger
   *   is a full question.
   */
  tone?: "label" | "question";
}

export default function CollapsibleSection({
  label,
  content,
  defaultOpen = false,
  tone = "label",
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  const triggerClass =
    tone === "question"
      ? "text-base sm:text-lg font-semibold text-navy group-hover:text-magenta transition-colors pr-4"
      : "text-sm font-semibold uppercase tracking-wider text-navy group-hover:text-magenta transition-colors";

  return (
    <div className="border-b border-beige last:border-b-0">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between py-5 text-left group"
        aria-expanded={open}
      >
        <span className={triggerClass}>{label}</span>
        <motion.svg
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="text-navy/65 flex-shrink-0"
        >
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </motion.svg>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-sm leading-relaxed text-navy/60">
              {content}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
