import type { ProductBadge as ProductBadgeData } from "@/data/products";

/**
 * Color-tokens per badge variant. Kept centralized so the print catalog's
 * red / blue / orange semantics stay consistent across every product page.
 */
const VARIANT_CLASSES: Record<ProductBadgeData["variant"], string> = {
  controlled: "bg-red-500 text-white",
  fda: "bg-[#6E469B] text-white",
  "coming-soon": "bg-orange-500 text-white",
  popular: "bg-magenta text-white",
  commercial: "bg-magenta text-white",
  info: "text-navy/80 bg-transparent border border-navy/15",
};

interface ProductBadgeProps {
  badge: ProductBadgeData;
}

export default function ProductBadge({ badge }: ProductBadgeProps) {
  const classes = VARIANT_CLASSES[badge.variant];
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${classes}`}
    >
      {badge.label}
      {badge.footnoteMark ? (
        <span className="ml-0.5" aria-hidden="true">
          {badge.footnoteMark}
        </span>
      ) : null}
    </span>
  );
}
