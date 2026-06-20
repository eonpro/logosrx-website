-- Affiliate partner program (EONPRO-style portal).
--
-- Adds the partner hierarchy (orgs → reps), referral links, attribution
-- columns on clinics/clinic_signups, the transaction + commission ledger, and
-- payouts. Idempotent and safe to re-run: enums are created inside exception
-- guards, tables use IF NOT EXISTS, and columns use ADD COLUMN IF NOT EXISTS.

-- --- Enums -----------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE partner_status AS ENUM ('pending', 'active', 'suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE commission_payee AS ENUM ('org', 'rep');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE commission_entry_status AS ENUM ('pending', 'approved', 'paid');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE transaction_source AS ENUM ('manual', 'csv', 'lifefile');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- --- Partner orgs ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS partner_orgs (
  id serial PRIMARY KEY,
  clerk_user_id varchar(64) UNIQUE,
  name varchar(200) NOT NULL,
  contact_name varchar(200),
  contact_email varchar(255) NOT NULL,
  contact_phone varchar(30),
  website varchar(255),
  notes text,
  status partner_status NOT NULL DEFAULT 'pending',
  commission_rate_bps integer NOT NULL DEFAULT 0,
  approved_at timestamp,
  approved_by varchar(64),
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS partner_orgs_contact_email_uniq
  ON partner_orgs (contact_email);
CREATE INDEX IF NOT EXISTS partner_orgs_status_idx ON partner_orgs (status);

-- --- Partner reps ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS partner_reps (
  id serial PRIMARY KEY,
  org_id integer NOT NULL REFERENCES partner_orgs (id) ON DELETE CASCADE,
  clerk_user_id varchar(64) UNIQUE,
  name varchar(200) NOT NULL,
  email varchar(255) NOT NULL,
  phone varchar(30),
  status partner_status NOT NULL DEFAULT 'pending',
  commission_rate_bps integer NOT NULL DEFAULT 0,
  invited_at timestamp NOT NULL DEFAULT now(),
  activated_at timestamp,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS partner_reps_org_id_idx ON partner_reps (org_id);
CREATE UNIQUE INDEX IF NOT EXISTS partner_reps_org_email_uniq
  ON partner_reps (org_id, email);

-- --- Referral links ----------------------------------------------------------

CREATE TABLE IF NOT EXISTS referral_links (
  id serial PRIMARY KEY,
  code varchar(32) NOT NULL UNIQUE,
  org_id integer NOT NULL REFERENCES partner_orgs (id) ON DELETE CASCADE,
  rep_id integer REFERENCES partner_reps (id) ON DELETE CASCADE,
  label varchar(120),
  active boolean NOT NULL DEFAULT true,
  click_count integer NOT NULL DEFAULT 0,
  signup_count integer NOT NULL DEFAULT 0,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS referral_links_org_id_idx ON referral_links (org_id);

-- --- Attribution columns on existing tables ----------------------------------

ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS referral_link_id integer
    REFERENCES referral_links (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS partner_org_id integer
    REFERENCES partner_orgs (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS partner_rep_id integer
    REFERENCES partner_reps (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS clinics_partner_org_idx ON clinics (partner_org_id);
CREATE INDEX IF NOT EXISTS clinics_partner_rep_idx ON clinics (partner_rep_id);

ALTER TABLE clinic_signups
  ADD COLUMN IF NOT EXISTS referral_link_id integer
    REFERENCES referral_links (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS partner_org_id integer
    REFERENCES partner_orgs (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS partner_rep_id integer
    REFERENCES partner_reps (id) ON DELETE SET NULL;

-- --- Transactions ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS partner_transactions (
  id serial PRIMARY KEY,
  clinic_id integer NOT NULL REFERENCES clinics (id) ON DELETE CASCADE,
  transaction_date timestamp NOT NULL,
  description varchar(300),
  reference varchar(120),
  revenue_cents integer NOT NULL,
  source transaction_source NOT NULL DEFAULT 'manual',
  created_by varchar(64) NOT NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS partner_transactions_clinic_id_idx
  ON partner_transactions (clinic_id);
CREATE INDEX IF NOT EXISTS partner_transactions_date_idx
  ON partner_transactions (transaction_date);

-- --- Payouts -----------------------------------------------------------------

CREATE TABLE IF NOT EXISTS payouts (
  id serial PRIMARY KEY,
  org_id integer NOT NULL REFERENCES partner_orgs (id) ON DELETE CASCADE,
  rep_id integer REFERENCES partner_reps (id) ON DELETE SET NULL,
  payee commission_payee NOT NULL,
  amount_cents integer NOT NULL,
  method varchar(40),
  reference varchar(200),
  notes text,
  paid_at timestamp NOT NULL DEFAULT now(),
  recorded_by varchar(64) NOT NULL,
  recorded_by_email varchar(255),
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payouts_org_id_idx ON payouts (org_id);

-- --- Commission ledger ---------------------------------------------------------

CREATE TABLE IF NOT EXISTS commission_entries (
  id serial PRIMARY KEY,
  transaction_id integer NOT NULL
    REFERENCES partner_transactions (id) ON DELETE CASCADE,
  org_id integer NOT NULL REFERENCES partner_orgs (id) ON DELETE CASCADE,
  rep_id integer REFERENCES partner_reps (id) ON DELETE SET NULL,
  payee commission_payee NOT NULL,
  rate_bps integer NOT NULL,
  amount_cents integer NOT NULL,
  status commission_entry_status NOT NULL DEFAULT 'pending',
  payout_id integer REFERENCES payouts (id) ON DELETE SET NULL,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS commission_entries_org_status_idx
  ON commission_entries (org_id, status);
CREATE INDEX IF NOT EXISTS commission_entries_rep_id_idx
  ON commission_entries (rep_id);
CREATE INDEX IF NOT EXISTS commission_entries_transaction_id_idx
  ON commission_entries (transaction_id);
CREATE INDEX IF NOT EXISTS commission_entries_payout_id_idx
  ON commission_entries (payout_id);
