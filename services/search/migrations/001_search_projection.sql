CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE search_document (
  media_id uuid PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  title_romaji text NOT NULL,
  title_english text,
  title_native text,
  title_id text,
  synonyms text[] NOT NULL DEFAULT '{}',
  genres text[] NOT NULL DEFAULT '{}',
  studios text[] NOT NULL DEFAULT '{}',
  platforms text[] NOT NULL DEFAULT '{}',
  format text NOT NULL DEFAULT 'UNKNOWN',
  status text NOT NULL DEFAULT 'UNKNOWN',
  season text,
  season_year smallint,
  score_avg numeric(4,2),
  popularity integer NOT NULL DEFAULT 0,
  cover_url text,
  is_adult boolean NOT NULL DEFAULT false,
  search_text text NOT NULL,
  search_vector tsvector GENERATED ALWAYS AS (to_tsvector('simple', search_text)) STORED,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX search_document_vector_idx ON search_document USING gin (search_vector);
CREATE INDEX search_document_romaji_trgm_idx ON search_document USING gin (lower(title_romaji) gin_trgm_ops);
CREATE INDEX search_document_english_trgm_idx ON search_document USING gin (lower(coalesce(title_english, '')) gin_trgm_ops);
CREATE INDEX search_document_id_trgm_idx ON search_document USING gin (lower(coalesce(title_id, '')) gin_trgm_ops);
CREATE INDEX search_document_popularity_idx ON search_document (popularity DESC, slug) WHERE is_adult = false;

CREATE TABLE search_sync_state (
  source text PRIMARY KEY,
  last_reindexed_at timestamptz,
  document_count integer NOT NULL DEFAULT 0
);

CREATE TABLE search_document_staging (LIKE search_document INCLUDING DEFAULTS INCLUDING CONSTRAINTS);
