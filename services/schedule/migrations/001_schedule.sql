CREATE TABLE schedule_slot (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id uuid NOT NULL,
  day_of_week smallint NOT NULL,
  time_wib time NOT NULL,
  base_episode smallint NOT NULL DEFAULT 1,
  base_date date NOT NULL,
  episodes smallint,
  confidence text NOT NULL DEFAULT 'ESTIMATED',
  source text NOT NULL DEFAULT 'MANUAL',
  source_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT schedule_day_check CHECK (day_of_week BETWEEN 1 AND 7),
  CONSTRAINT schedule_base_episode_check CHECK (base_episode >= 1),
  CONSTRAINT schedule_episodes_check CHECK (episodes IS NULL OR episodes >= base_episode),
  CONSTRAINT schedule_confidence_check CHECK (confidence IN ('CONFIRMED', 'ESTIMATED')),
  CONSTRAINT schedule_source_check CHECK (source IN ('OFFICIAL_SITE', 'PLATFORM', 'MANUAL', 'PROVIDER')),
  CONSTRAINT schedule_slot_unique UNIQUE (media_id, day_of_week, time_wib)
);

CREATE TABLE schedule_outbox (
  event_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  event_version smallint NOT NULL DEFAULT 1,
  payload jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);

CREATE TABLE idempotency_keys (
  key text PRIMARY KEY,
  request_hash text NOT NULL,
  response_body jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX schedule_day_time_idx ON schedule_slot (day_of_week, time_wib);
CREATE INDEX schedule_media_idx ON schedule_slot (media_id);
CREATE INDEX schedule_outbox_pending_idx ON schedule_outbox (created_at) WHERE published_at IS NULL;
