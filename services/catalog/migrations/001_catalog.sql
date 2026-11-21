CREATE TABLE media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title_romaji text NOT NULL,
  title_english text,
  title_native text,
  title_id text,
  synopsis_id text,
  format text NOT NULL DEFAULT 'UNKNOWN',
  status text NOT NULL DEFAULT 'UNKNOWN',
  season text,
  season_year smallint,
  episodes smallint,
  duration_minutes smallint,
  score_avg numeric(4, 2),
  popularity integer NOT NULL DEFAULT 0,
  cover_url text,
  banner_url text,
  synonyms text[] NOT NULL DEFAULT '{}',
  genres text[] NOT NULL DEFAULT '{}',
  studios text[] NOT NULL DEFAULT '{}',
  is_adult boolean NOT NULL DEFAULT false,
  content_status text NOT NULL DEFAULT 'MISSING',
  curated_fields text[] NOT NULL DEFAULT '{}',
  provenance jsonb NOT NULL DEFAULT '{}'::jsonb,
  source text NOT NULL,
  source_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT media_season_check CHECK (season IS NULL OR season IN ('WINTER', 'SPRING', 'SUMMER', 'FALL')),
  CONSTRAINT media_season_year_check CHECK (season_year IS NULL OR season_year BETWEEN 1900 AND 2100),
  CONSTRAINT media_episodes_check CHECK (episodes IS NULL OR episodes >= 0),
  CONSTRAINT media_score_check CHECK (score_avg IS NULL OR score_avg BETWEEN 0 AND 10),
  CONSTRAINT media_content_status_check CHECK (content_status IN ('MISSING', 'DRAFT', 'REVIEWED', 'PUBLISHED', 'REJECTED'))
);

CREATE TABLE external_id (
  provider text NOT NULL,
  external_id text NOT NULL,
  media_id uuid NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  source_url text,
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, external_id),
  UNIQUE (media_id, provider)
);

CREATE TABLE catalog_outbox (
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

CREATE INDEX media_public_popularity_idx ON media (popularity DESC, title_romaji) WHERE is_adult = false;
CREATE INDEX media_season_idx ON media (season_year DESC, season) WHERE is_adult = false;
CREATE INDEX media_genres_gin_idx ON media USING gin (genres);
CREATE INDEX external_id_media_idx ON external_id (media_id);
CREATE INDEX catalog_outbox_pending_idx ON catalog_outbox (created_at) WHERE published_at IS NULL;
