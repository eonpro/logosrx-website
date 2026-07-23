-- 0017_invoice_uploads.sql
-- Adds pharmacy-invoice PDF support to partner transactions:
--   * new `invoice` value on the transaction_source enum
--   * `invoice_pathname` / `invoice_filename` columns storing the private
--     @vercel/blob pathname and the sanitized original filename
-- Admins upload an invoice PDF for an attributed clinic; the transaction (and
-- its commission ledger entries) is recorded with the document attached so
-- sales reps get credit for the sale. Additive + idempotent.
--
--   npx tsx scripts/apply-sql.ts scripts/sql/0017_invoice_uploads.sql

ALTER TYPE transaction_source ADD VALUE IF NOT EXISTS 'invoice';

ALTER TABLE partner_transactions
  ADD COLUMN IF NOT EXISTS invoice_pathname text;

ALTER TABLE partner_transactions
  ADD COLUMN IF NOT EXISTS invoice_filename varchar(255);
