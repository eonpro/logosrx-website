-- Org-wide goal dedupe. Idempotent.
--
-- The composite unique index (org_id, rep_id, metric, period) does not dedupe
-- org-wide goals because Postgres treats NULL rep_id values as distinct, and
-- the app's find-then-insert was racy. Remove any duplicates that slipped in
-- (keeping the most recently updated row), then enforce uniqueness with a
-- partial index.

DELETE FROM partner_goals a
USING partner_goals b
WHERE a.rep_id IS NULL
  AND b.rep_id IS NULL
  AND a.org_id = b.org_id
  AND a.metric = b.metric
  AND a.period = b.period
  AND (a.updated_at, a.id) < (b.updated_at, b.id);

CREATE UNIQUE INDEX IF NOT EXISTS partner_goals_org_wide_metric_period_uniq
  ON partner_goals (org_id, metric, period)
  WHERE rep_id IS NULL;
