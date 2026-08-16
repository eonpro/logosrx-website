-- 0019_bpc157_coming_soon.sql
-- Mark BPC-157 as Coming Soon in the live catalog (clinic storefront + /catalog).
-- The static seed in src/data/catalog.ts was updated in the same change; this
-- updates already-seeded production rows (seed is insert-only).
--
--   npx tsx scripts/apply-sql.ts scripts/sql/0019_bpc157_coming_soon.sql

UPDATE catalog_products
SET badge = 'Coming Soon',
    updated_at = now()
WHERE id = 'bpc-157-2.5mg-4ml'
  AND (badge IS DISTINCT FROM 'Coming Soon');
