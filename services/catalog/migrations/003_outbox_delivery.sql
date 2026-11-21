ALTER TABLE catalog_outbox
  ADD COLUMN attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN locked_until timestamptz,
  ADD COLUMN last_error text;

DROP INDEX IF EXISTS catalog_outbox_pending_idx;
CREATE INDEX catalog_outbox_pending_idx
  ON catalog_outbox (created_at, event_id)
  WHERE published_at IS NULL;
