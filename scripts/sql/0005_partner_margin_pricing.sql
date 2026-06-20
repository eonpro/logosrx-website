-- Partner margin / wholesale floor-pricing model.
--
-- Adds a per-org compensation model (commission vs margin), a per-product
-- wholesale floor price list for margin-model orgs, and a cost column on
-- partner transactions so margin (revenue − cost) can feed the commission
-- ledger. Idempotent and safe to re-run.

-- --- Enum -------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE partner_compensation_model AS ENUM ('commission', 'margin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- --- partner_orgs: compensation model --------------------------------------

ALTER TABLE partner_orgs
  ADD COLUMN IF NOT EXISTS compensation_model partner_compensation_model
    NOT NULL DEFAULT 'commission';

-- --- Per-product wholesale floor price list --------------------------------

CREATE TABLE IF NOT EXISTS partner_org_pricing (
  id serial PRIMARY KEY,
  org_id integer NOT NULL REFERENCES partner_orgs (id) ON DELETE CASCADE,
  product_id varchar(120) NOT NULL,
  product_name varchar(200) NOT NULL,
  floor_cents integer NOT NULL,
  unit varchar(60),
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS partner_org_pricing_org_product_uniq
  ON partner_org_pricing (org_id, product_id);

-- --- partner_transactions: wholesale cost for margin orgs -------------------

ALTER TABLE partner_transactions
  ADD COLUMN IF NOT EXISTS cost_cents integer;
