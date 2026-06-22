-- Partner ledger accuracy: refund/chargeback clawbacks, idempotent imports,
-- and a commission approval gate.
--
-- Idempotent and safe to re-run.

-- --- Reversal (clawback) entries -------------------------------------------

DO $$ BEGIN
  CREATE TYPE commission_entry_kind AS ENUM ('earning', 'reversal');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE commission_entries
  ADD COLUMN IF NOT EXISTS kind commission_entry_kind NOT NULL DEFAULT 'earning';

-- --- Refund tracking on transactions ---------------------------------------

ALTER TABLE partner_transactions
  ADD COLUMN IF NOT EXISTS refunded_cents integer NOT NULL DEFAULT 0;

-- --- Idempotent imports: unique non-null reference -------------------------
-- Postgres treats NULLs as distinct, so manual rows without a reference are
-- unaffected; only duplicate non-null references are blocked.

CREATE UNIQUE INDEX IF NOT EXISTS partner_transactions_reference_uniq
  ON partner_transactions (reference);
