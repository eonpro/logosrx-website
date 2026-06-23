-- 0014_catalog_products.sql
-- Moves the product catalog from the static `catalogProducts` array in
-- `src/data/catalog.ts` into the database so a super admin can edit prices and
-- the SKU roster live via `/admin/catalog`. Idempotent (IF NOT EXISTS); after
-- applying, run `npm run db:seed-catalog` to backfill the current SKUs.
--
--   npx tsx scripts/apply-sql.ts scripts/sql/0014_catalog_products.sql

CREATE TABLE IF NOT EXISTS catalog_products (
  id                varchar(120) PRIMARY KEY,
  name              varchar(200) NOT NULL,
  strength          varchar(120),
  form              varchar(60)  NOT NULL,
  unit              varchar(60),
  pricing           jsonb        NOT NULL DEFAULT '{}'::jsonb,
  product_family    jsonb        NOT NULL DEFAULT '[]'::jsonb,
  brand             varchar(60),
  therapeutic_areas jsonb        NOT NULL DEFAULT '[]'::jsonb,
  details           text,
  badge             varchar(60),
  sort_order        integer      NOT NULL DEFAULT 0,
  active            boolean      NOT NULL DEFAULT true,
  created_at        timestamp    NOT NULL DEFAULT now(),
  updated_at        timestamp    NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS catalog_products_active_sort_idx
  ON catalog_products (active, sort_order);
