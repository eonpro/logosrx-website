-- Partner read-only API keys + webhook subscriptions. Idempotent.

CREATE TABLE IF NOT EXISTS partner_api_keys (
  id serial PRIMARY KEY,
  org_id integer NOT NULL REFERENCES partner_orgs (id) ON DELETE CASCADE,
  name varchar(120) NOT NULL,
  key_prefix varchar(24) NOT NULL,
  key_hash varchar(64) NOT NULL UNIQUE,
  last_used_at timestamp,
  revoked_at timestamp,
  created_by varchar(64),
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS partner_api_keys_org_idx ON partner_api_keys (org_id);

CREATE TABLE IF NOT EXISTS partner_webhooks (
  id serial PRIMARY KEY,
  org_id integer NOT NULL REFERENCES partner_orgs (id) ON DELETE CASCADE,
  url varchar(500) NOT NULL,
  secret varchar(80) NOT NULL,
  events jsonb NOT NULL DEFAULT '[]'::jsonb,
  active boolean NOT NULL DEFAULT true,
  last_delivery_at timestamp,
  last_status integer,
  created_by varchar(64),
  created_at timestamp NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS partner_webhooks_org_idx ON partner_webhooks (org_id);
