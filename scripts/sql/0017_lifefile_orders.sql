-- 0017_lifefile_orders.sql
-- In-app prescribing: clinics place prescription orders through the LogosRx
-- dashboard and we forward them to LifeFile via their API (POST /order).
-- Adds per-clinic LifeFile config, catalog -> LifeFile product mapping, and
-- the clinic-scoped patients / orders / order_rxs tables. Idempotent.
--
--   npx tsx scripts/apply-sql.ts scripts/sql/0017_lifefile_orders.sql

-- Per-clinic LifeFile ordering config.
ALTER TABLE clinics
  ADD COLUMN IF NOT EXISTS lifefile_ordering_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS lifefile_practice_id integer,
  ADD COLUMN IF NOT EXISTS lifefile_default_service_id integer;

-- Catalog -> LifeFile product mapping. lf_product_id NULL = not orderable.
ALTER TABLE catalog_products
  ADD COLUMN IF NOT EXISTS lf_product_id integer,
  ADD COLUMN IF NOT EXISTS schedule_code varchar(1),
  ADD COLUMN IF NOT EXISTS quantity_units varchar(45),
  ADD COLUMN IF NOT EXISTS default_quantity varchar(45);

-- Order lifecycle enum.
DO $$ BEGIN
  CREATE TYPE lifefile_order_status AS ENUM (
    'submitted',
    'accepted',
    'pharmacy_rejected',
    'failed'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Clinic-scoped saved patients.
CREATE TABLE IF NOT EXISTS patients (
  id serial PRIMARY KEY,
  clinic_id integer NOT NULL REFERENCES clinics (id) ON DELETE CASCADE,
  first_name varchar(30) NOT NULL,
  last_name varchar(30) NOT NULL,
  middle_name varchar(20),
  gender varchar(1) NOT NULL,
  date_of_birth varchar(10) NOT NULL,
  address1 varchar(60),
  address2 varchar(60),
  city varchar(100),
  state varchar(2),
  zip varchar(10),
  phone_home varchar(16),
  phone_mobile varchar(16),
  phone_work varchar(16),
  email varchar(100),
  allergies jsonb NOT NULL DEFAULT '[]'::jsonb,
  conditions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS patients_clinic_id_idx
  ON patients (clinic_id, last_name);

-- Prescription orders forwarded to LifeFile.
CREATE TABLE IF NOT EXISTS orders (
  id serial PRIMARY KEY,
  clinic_id integer NOT NULL REFERENCES clinics (id) ON DELETE RESTRICT,
  patient_id integer NOT NULL REFERENCES patients (id) ON DELETE RESTRICT,
  reference_id varchar(64) NOT NULL,
  lf_order_id varchar(32),
  message_id integer,
  status lifefile_order_status NOT NULL DEFAULT 'submitted',
  prescriber jsonb NOT NULL,
  shipping jsonb NOT NULL,
  service_id integer,
  payor_type varchar(3) NOT NULL DEFAULT 'doc',
  memo varchar(120),
  error_message varchar(500),
  raw_request jsonb,
  raw_response jsonb,
  submitted_by varchar(64),
  created_at timestamp NOT NULL DEFAULT now(),
  updated_at timestamp NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS orders_clinic_reference_uniq
  ON orders (clinic_id, reference_id);
CREATE INDEX IF NOT EXISTS orders_clinic_created_idx
  ON orders (clinic_id, created_at);
CREATE INDEX IF NOT EXISTS orders_lf_order_id_idx ON orders (lf_order_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status);

-- Prescription lines (drug fields snapshotted at submission time).
CREATE TABLE IF NOT EXISTS order_rxs (
  id serial PRIMARY KEY,
  order_id integer NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  catalog_product_id varchar(120),
  lf_product_id integer NOT NULL,
  drug_name varchar(254) NOT NULL,
  drug_strength varchar(254),
  drug_form varchar(255),
  directions text NOT NULL,
  quantity varchar(45),
  quantity_units varchar(45),
  days_supply integer,
  refills integer NOT NULL DEFAULT 0,
  date_written varchar(10) NOT NULL,
  clinical_difference_statement text,
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS order_rxs_order_id_idx ON order_rxs (order_id);
