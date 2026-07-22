import Image from "next/image";
import type {
  DosageScheduleColumn,
  DosageScheduleRow,
  Product,
  ProductVariant,
  ProductVariantColumn,
} from "@/data/products";
import type { BookPriceItem } from "@/data/catalog-book";

const VARIANT_COLUMN_LABEL: Record<ProductVariantColumn, string> = {
  strength: "Strength",
  form: "Form",
  quantity: "Quantity",
  vialTotalMg: "Vial Total mg",
  concentration: "Concentration",
  ml: "mL",
};

const DOSAGE_COLUMN_LABEL: Record<DosageScheduleColumn, string> = {
  weeks: "Weeks",
  units: "Units",
  mg: "MG",
  ml: "mL",
  directions: "SIG / Directions",
};

const PRICE_FORMATTER = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function variantCell(v: ProductVariant, key: ProductVariantColumn): string {
  return v[key] ?? "—";
}

function dosageCell(r: DosageScheduleRow, key: DosageScheduleColumn): string {
  return r[key] ?? "—";
}

interface BookProductPageProps {
  product: Product;
  /** Live suggested-retail rows for this page's catalog SKUs. */
  prices: BookPriceItem[];
}

/**
 * One product "page" of the native catalog book. Mirrors the visual hierarchy
 * of the printed page — eyebrow, name, description, vial photo, product
 * details, dosage & titration — plus a live Suggested Retail block the PDF
 * never had.
 */
export default function BookProductPage({ product, prices }: BookProductPageProps) {
  const variantColumns = product.variantColumns ?? [];
  const variants = product.variants ?? [];
  const hasVariantImages = variants.some((v) => v.image);
  const schedule = product.dosageSchedule;

  return (
    <div className="min-h-full bg-white px-6 py-10 sm:px-10 sm:py-12 lg:px-14">
      {/* Header: copy left, vial right */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="book-rise">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-magenta">
            {product.categoryKey} · {product.category}
          </p>
          <h2 className="mt-3 text-3xl font-bold leading-tight text-navy sm:text-4xl">
            {product.name}
            {product.modifier && (
              <span className="mt-1 block text-xl font-medium italic text-navy/60 sm:text-2xl">
                {/* Mirror the print treatment: "in Grape Seed Oil", "plus Glycine". */}
                {product.modifierStyle === "in" && "in "}
                {product.modifierStyle === "plus" && "plus "}
                {product.modifier}
              </span>
            )}
          </h2>

          <div className="mt-5 space-y-4">
            {(product.descriptionParagraphs ?? [product.description]).map(
              (paragraph) => (
                <p
                  key={paragraph.slice(0, 40)}
                  className="text-sm leading-relaxed text-navy/75 sm:text-[15px]"
                >
                  {paragraph}
                </p>
              ),
            )}
          </div>

          {product.compoundingDisclaimer && (
            <p className="mt-5 rounded-xl border border-beige bg-cream/70 px-4 py-3 text-xs leading-relaxed text-navy/65">
              {product.compoundingDisclaimer}
            </p>
          )}
        </div>

        {product.image && (
          <div
            className="book-rise flex items-start justify-center"
            style={{ animationDelay: "90ms" }}
          >
            <div className="group w-full max-w-[280px] overflow-hidden rounded-2xl bg-gradient-to-b from-cream to-beige/60 p-6 transition-shadow duration-300 hover:shadow-xl hover:shadow-navy/10">
              <Image
                src={product.image}
                alt={product.imageAlt ?? product.name}
                width={480}
                height={480}
                className="animate-book-float h-auto w-full rounded-xl object-contain transition-transform duration-500 ease-out group-hover:scale-110"
              />
            </div>
          </div>
        )}
      </div>

      {/* Product details */}
      {variantColumns.length > 0 && variants.length > 0 && (
        <section className="book-rise mt-10" style={{ animationDelay: "180ms" }}>
          <h3 className="text-sm font-bold uppercase tracking-wider text-navy">
            Product Details
          </h3>
          <div className="mt-3 overflow-hidden rounded-2xl border border-beige">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-navy text-white">
                    {hasVariantImages && (
                      <th scope="col" className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider">
                        Vial
                      </th>
                    )}
                    {variantColumns.map((c) => (
                      <th
                        key={c}
                        scope="col"
                        className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider"
                      >
                        {VARIANT_COLUMN_LABEL[c]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {variants.map((variant, i) => (
                    <tr
                      key={i}
                      className={`transition-colors hover:bg-sky-light/15 ${i % 2 === 0 ? "bg-white" : "bg-cream/50"}`}
                    >
                      {hasVariantImages && (
                        <td className="px-4 py-2">
                          {variant.image ? (
                            <Image
                              src={variant.image}
                              alt={variant.imageAlt ?? `${product.name} vial`}
                              width={64}
                              height={64}
                              className="h-12 w-auto object-contain"
                            />
                          ) : (
                            <span className="text-navy/30">—</span>
                          )}
                        </td>
                      )}
                      {variantColumns.map((c, j) => (
                        <td
                          key={`${i}-${c}`}
                          className={`px-4 py-3 text-sm text-navy/80 ${j === 0 ? "font-semibold text-navy" : ""}`}
                        >
                          {variantCell(variant, c)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {product.variantNote && (
            <p className="mt-3 text-xs italic leading-relaxed text-navy/60">
              {product.variantNote}
            </p>
          )}
        </section>
      )}

      {/* Suggested retail — live from the catalog DB */}
      {prices.length > 0 && (
        <section className="book-rise mt-8" style={{ animationDelay: "260ms" }}>
          <h3 className="text-sm font-bold uppercase tracking-wider text-navy">
            Suggested Retail
          </h3>
          <div className="mt-3 overflow-hidden rounded-2xl border border-beige">
            <table className="w-full text-left">
              <tbody>
                {prices.map((item, i) => (
                  <tr
                    key={item.id}
                    className={`transition-colors hover:bg-magenta/5 ${i % 2 === 0 ? "bg-white" : "bg-cream/50"}`}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-navy">
                      {item.name}
                      {(item.strength || item.unit) && (
                        <span className="ml-2 text-xs font-normal text-navy/55">
                          {[item.strength, item.unit].filter(Boolean).join(" · ")}
                        </span>
                      )}
                    </td>
                    <td
                      className={`px-4 py-3 text-right text-sm font-bold tabular-nums ${
                        item.retail === null
                          ? "font-medium italic text-navy/45"
                          : "text-magenta"
                      }`}
                    >
                      {item.retail === null
                        ? "Contact rep"
                        : PRICE_FORMATTER.format(item.retail)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-navy/55">
            Suggested retail (cash-pay) pricing. Provider &amp; volume pricing
            available through your Logos sales rep.
          </p>
        </section>
      )}

      {/* Dosage & titration */}
      {schedule && schedule.rows.length > 0 && schedule.columns.length > 0 && (
        <section className="book-rise mt-8" style={{ animationDelay: "340ms" }}>
          <h3 className="text-sm font-bold uppercase tracking-wider text-navy">
            Typical dosage &amp; titration schedule
          </h3>
          <div className="mt-3 overflow-hidden rounded-2xl border border-beige">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-beige bg-beige/40">
                    {schedule.columns.map((c) => (
                      <th
                        key={c}
                        scope="col"
                        className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-navy/70"
                      >
                        {DOSAGE_COLUMN_LABEL[c]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {schedule.rows.map((row, i) => (
                    <tr
                      key={i}
                      className={`border-b border-beige/60 transition-colors last:border-b-0 hover:bg-sky-light/15 ${
                        i % 2 === 0 ? "bg-white" : "bg-cream/40"
                      }`}
                    >
                      {schedule.columns.map((c, j) => (
                        <td
                          key={`${i}-${c}`}
                          className={`px-4 py-3 align-top text-sm text-navy/85 ${
                            j === 0 ? "whitespace-nowrap font-semibold text-navy" : ""
                          } ${c === "directions" ? "min-w-[240px]" : ""}`}
                        >
                          {dosageCell(row, c)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {schedule.note && (
            <p className="mt-3 max-w-3xl text-xs italic leading-relaxed text-navy/60">
              {schedule.note}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
