import {
  baseCatalogPrice,
  CATALOG_CONFIG,
  formatPrice,
  type CatalogProduct,
} from "@/data/catalog";

interface CatalogTableProps {
  items: CatalogProduct[];
}

/**
 * Pure presentation: takes the already-filtered, sorted, and paginated slice
 * of products and renders them as a semantic `<table>`.
 *
 * Why a real `<table>` and not divs:
 *   - Screen readers announce row / column / total counts natively.
 *   - Keyboard users can navigate cell-by-cell with VoiceOver / NVDA table
 *     mode.
 *   - Column widths align across rows without flex juggling.
 */
export default function CatalogTable({ items }: CatalogTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-beige bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <caption className="sr-only">
            Catalog of compounded medications with base pricing. Contact your
            Logos sales rep for volume and custom preferred pricing.
          </caption>
          <thead>
            <tr className="border-b border-beige bg-cream/60 text-left">
              <th
                scope="col"
                className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-navy/70"
              >
                Drug name
              </th>
              <th
                scope="col"
                className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-navy/70 whitespace-nowrap"
              >
                Strength
              </th>
              <th
                scope="col"
                className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-navy/70 whitespace-nowrap"
              >
                Form
              </th>
              <th
                scope="col"
                className="px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-navy/70 whitespace-nowrap"
              >
                Unit
              </th>
              <th
                scope="col"
                className="px-4 py-3.5 text-right text-xs font-bold uppercase tracking-wider whitespace-nowrap text-magenta"
              >
                {CATALOG_CONFIG.basePriceLabel}
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((product, idx) => (
              <CatalogRow
                key={product.id}
                product={product}
                isLast={idx === items.length - 1}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface CatalogRowProps {
  product: CatalogProduct;
  isLast: boolean;
}

/**
 * One row of the catalog table — plus an optional detail sub-row beneath it
 * for products with a `details` description. The detail row spans all
 * columns and is intentionally rendered as a separate `<tr>` so that screen
 * readers still announce it in row context.
 */
function CatalogRow({ product, isLast }: CatalogRowProps) {
  const basePrice = baseCatalogPrice(product);
  const rowClass = `transition-colors hover:bg-cream/60 ${isLast && !product.details ? "" : "border-b border-beige/70"}`;

  return (
    <>
      <tr id={`sku-${product.id}`} className={rowClass}>
        <th
          scope="row"
          className="px-4 py-3.5 text-left text-sm font-semibold text-navy"
        >
          <div className="flex items-start gap-2">
            <span>{product.name}</span>
            {product.badge && (
              <span className="mt-0.5 inline-flex shrink-0 items-center rounded-full bg-magenta/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-magenta">
                {product.badge}
              </span>
            )}
          </div>
        </th>
        <td className="px-4 py-3.5 text-sm text-navy/75 whitespace-nowrap">
          {product.strength ?? "—"}
        </td>
        <td className="px-4 py-3.5 text-sm text-navy/75 whitespace-nowrap">
          {product.form}
        </td>
        <td className="px-4 py-3.5 text-sm text-navy/75 whitespace-nowrap">
          {product.unit ?? "Each"}
        </td>
        <td
          className={`px-4 py-3.5 text-right text-sm font-bold tabular-nums whitespace-nowrap ${
            basePrice === null || basePrice === undefined
              ? "text-navy/40 italic"
              : "text-magenta"
          }`}
        >
          {formatPrice(basePrice)}
        </td>
      </tr>

      {product.details && (
        <tr
          className={isLast ? "" : "border-b border-beige/70"}
          aria-describedby={`sku-${product.id}`}
        >
          <td
            colSpan={5}
            className="bg-cream/40 px-4 pb-3 pt-0 text-xs text-navy/70 leading-relaxed"
          >
            <span className="mr-1 font-semibold uppercase tracking-wider text-navy/55">
              Details:
            </span>
            {product.details}
          </td>
        </tr>
      )}
    </>
  );
}
