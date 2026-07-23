/**
 * Seeds the catalog -> LifeFile product mapping (`catalog_products.lf_product_id`,
 * `schedule_code`, `quantity_units`, `default_quantity`) from the product list
 * LifeFile provided at API activation (Jul 2026).
 *
 *   # dry run (prints what would change):
 *   NODE_OPTIONS=--conditions=react-server npx tsx scripts/seed-lifefile-mapping.ts
 *   # apply:
 *   NODE_OPTIONS=--conditions=react-server npx tsx scripts/seed-lifefile-mapping.ts --apply
 *
 * Uses .env.local for DB credentials (same as scripts/apply-sql.ts). Only the
 * SKUs listed here are touched; mappings can be edited any time in
 * /admin/orders/mapping. Schedule codes: testosterone cypionate is C-III;
 * everything else in this list is a legend drug (L).
 *
 * Deliberately unmapped (no exact LifeFile counterpart provided — vial size
 * or strength differs, or the product wasn't on LifeFile's list):
 *   nad-plus-100mg-5ml        (LifeFile lists a 10 mL vial only)
 *   glutathione-200mg-5ml     (LifeFile lists a 10 mL vial only)
 *   tesamorelin-5mg-4ml, bpc-157-2.5mg-4ml, anastrozole-1mg,
 *   metformin-850mg, metformin-1000mg, minoxidil-2.5mg
 */

import { config } from "dotenv";
config({ path: ".env.local" });

interface MappingRow {
  /** catalog_products.id (SKU slug) */
  sku: string;
  lfProductId: number;
  /** DEA schedule: 2-5 controlled, L legend, O OTC. */
  scheduleCode: "2" | "3" | "4" | "5" | "L" | "O";
}

const MAPPING: MappingRow[] = [
  // GLP-1s — semaglutide / glycine
  { sku: "semaglutide-glycine-2.5mg-1ml", lfProductId: 203448971, scheduleCode: "L" },
  { sku: "semaglutide-glycine-2.5mg-2ml", lfProductId: 203448947, scheduleCode: "L" },
  { sku: "semaglutide-glycine-2.5mg-3ml", lfProductId: 203449363, scheduleCode: "L" },
  { sku: "semaglutide-glycine-2.5mg-5ml", lfProductId: 203448974, scheduleCode: "L" },
  { sku: "semaglutide-glycine-5mg-2ml", lfProductId: 202851329, scheduleCode: "L" },
  // GLP-1s — tirzepatide / glycine
  { sku: "tirzepatide-glycine-10mg-1ml", lfProductId: 203448972, scheduleCode: "L" },
  { sku: "tirzepatide-glycine-10mg-2ml", lfProductId: 203448973, scheduleCode: "L" },
  { sku: "tirzepatide-glycine-10mg-3ml", lfProductId: 203449364, scheduleCode: "L" },
  { sku: "tirzepatide-glycine-10mg-4ml", lfProductId: 203449500, scheduleCode: "L" },
  { sku: "tirzepatide-glycine-30mg-2ml", lfProductId: 203418602, scheduleCode: "L" },
  // Hormones / men's health
  // C-III anabolic steroid — mapping recorded, but schedule 3 keeps it
  // blocked from in-app ordering (LifeFile requires a signed Rx PDF).
  { sku: "testosterone-cypionate-200mg-5ml", lfProductId: 203418861, scheduleCode: "3" },
  { sku: "enclomiphene-citrate-25mg", lfProductId: 203449329, scheduleCode: "L" },
  { sku: "enclomiphene-citrate-50mg", lfProductId: 203449330, scheduleCode: "L" },
  { sku: "anastrozole-0.25mg", lfProductId: 203449460, scheduleCode: "L" },
  { sku: "anastrozole-0.5mg", lfProductId: 203194021, scheduleCode: "L" },
  { sku: "pregnyl-hcg-10000iu", lfProductId: 203449527, scheduleCode: "L" },
  { sku: "finasteride-1mg", lfProductId: 203194031, scheduleCode: "L" },
  // Peptides / wellness
  { sku: "sermorelin-10mg-5ml", lfProductId: 203666651, scheduleCode: "L" },
  { sku: "cyanocobalamin-b12-10000mcg", lfProductId: 203449111, scheduleCode: "L" },
  // Metabolic / GI
  { sku: "metformin-500mg", lfProductId: 203194032, scheduleCode: "L" },
  { sku: "ondansetron-4mg", lfProductId: 203449425, scheduleCode: "L" },
  // Low-dose naltrexone
  { sku: "low-dose-naltrexone-1.5mg", lfProductId: 204427815, scheduleCode: "L" },
  { sku: "low-dose-naltrexone-3mg", lfProductId: 204427816, scheduleCode: "L" },
  { sku: "low-dose-naltrexone-4.5mg", lfProductId: 204427817, scheduleCode: "L" },
];

async function main() {
  const apply = process.argv.includes("--apply");
  const { eq } = await import("drizzle-orm");
  const { db } = await import("../src/lib/db");
  const { catalogProducts } = await import("../src/lib/db/schema");

  const rows = await db
    .select({
      id: catalogProducts.id,
      name: catalogProducts.name,
      lfProductId: catalogProducts.lfProductId,
      scheduleCode: catalogProducts.scheduleCode,
    })
    .from(catalogProducts);
  const bySku = new Map(rows.map((r) => [r.id, r]));

  let updates = 0;
  let missing = 0;
  for (const m of MAPPING) {
    const row = bySku.get(m.sku);
    if (!row) {
      console.log(`  ✗ SKU not in catalog: ${m.sku} (LF ${m.lfProductId})`);
      missing++;
      continue;
    }
    const changed =
      row.lfProductId !== m.lfProductId || row.scheduleCode !== m.scheduleCode;
    const tag = changed ? (apply ? "UPDATED" : "would update") : "unchanged";
    console.log(
      `  ${changed ? "•" : "="} ${m.sku} -> LF ${m.lfProductId} [${m.scheduleCode}] (${tag})`,
    );
    if (!changed) continue;
    updates++;
    if (apply) {
      await db
        .update(catalogProducts)
        .set({
          lfProductId: m.lfProductId,
          scheduleCode: m.scheduleCode,
          // One vial/bottle per pack; quantity counts packs.
          quantityUnits: "each",
          defaultQuantity: "1",
          updatedAt: new Date(),
        })
        .where(eq(catalogProducts.id, m.sku));
    }
  }

  const unmapped = rows.filter(
    (r) => !MAPPING.some((m) => m.sku === r.id) && r.lfProductId == null,
  );
  if (unmapped.length) {
    console.log(`\nStill unmapped in catalog (${unmapped.length}):`);
    for (const r of unmapped) console.log(`  - ${r.id} (${r.name})`);
  }

  console.log(
    `\n${apply ? "Applied" : "Dry run:"} ${updates} update(s), ${missing} missing SKU(s).` +
      (apply ? "" : " Re-run with --apply to write."),
  );
  process.exit(missing > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
