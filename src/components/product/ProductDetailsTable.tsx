import type {
  Product,
  ProductVariant,
  ProductVariantColumn,
} from "@/data/products";
import Reveal from "../Reveal";

const COLUMN_LABEL: Record<ProductVariantColumn, string> = {
  strength: "Strength",
  form: "Form",
  quantity: "Quantity",
  vialTotalMg: "Vial Total mg",
  concentration: "Concentration",
  ml: "mL",
};

function getCell(variant: ProductVariant, key: ProductVariantColumn): string {
  return variant[key] ?? "—";
}

interface ProductDetailsTableProps {
  product: Product;
}

export default function ProductDetailsTable({ product }: ProductDetailsTableProps) {
  const columns = product.variantColumns ?? [];
  const rows = product.variants ?? [];
  if (columns.length === 0 || rows.length === 0) return null;

  return (
    <section id="product-details" className="bg-cream py-20 sm:py-28 scroll-mt-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-magenta mb-4">
            Product Details
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-navy leading-[1.15]">
            Available formulations
          </h2>
        </Reveal>

        <Reveal delay={80} className="mt-10 overflow-hidden rounded-3xl border border-beige/70 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-navy text-white">
                  {columns.map((c) => (
                    <th
                      key={c}
                      scope="col"
                      className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider"
                    >
                      {COLUMN_LABEL[c]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((variant, i) => (
                  <tr
                    key={i}
                    className={i % 2 === 0 ? "bg-white" : "bg-cream/50"}
                  >
                    {columns.map((c, j) => (
                      <td
                        key={`${i}-${c}`}
                        className={`px-6 py-4 text-sm text-navy/80 ${
                          j === 0 ? "font-semibold text-navy" : ""
                        }`}
                      >
                        {getCell(variant, c)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>

        {product.variantNote ? (
          <Reveal delay={160}>
            <p className="mt-5 text-xs italic text-navy/60 leading-relaxed">
              {product.variantNote}
            </p>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
