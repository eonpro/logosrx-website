-- 0015_quote_admin_referral.sql
-- Adds `admin_referral` to `pricing_quotes`: true when an admin created a quote
-- and attributed it to a partner as a referral (the partner sees it read-only,
-- Logos RX owns it). Partner-created quotes stay false so they remain fully
-- manageable by the partner. Additive + idempotent; adding a NOT NULL column
-- with a constant default is a metadata-only change on PG 11+ (no table rewrite).
--
--   npx tsx scripts/apply-sql.ts scripts/sql/0015_quote_admin_referral.sql

ALTER TABLE pricing_quotes
  ADD COLUMN IF NOT EXISTS admin_referral boolean NOT NULL DEFAULT false;
