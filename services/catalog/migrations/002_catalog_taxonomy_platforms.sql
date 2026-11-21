CREATE TABLE catalog_genre (
  slug text PRIMARY KEY,
  name text NOT NULL,
  name_id text,
  description_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE catalog_studio (
  slug text PRIMARY KEY,
  name text NOT NULL,
  name_native text,
  website_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE catalog_platform (
  slug text PRIMARY KEY,
  name text NOT NULL,
  website_url text NOT NULL,
  search_url_template text,
  color text,
  description text,
  sort_order smallint NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  legal_status text NOT NULL DEFAULT 'UNVERIFIED',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE media_genre (
  media_id uuid NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  genre_slug text NOT NULL REFERENCES catalog_genre(slug) ON DELETE RESTRICT,
  PRIMARY KEY (media_id, genre_slug)
);

CREATE TABLE media_studio (
  media_id uuid NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  studio_slug text NOT NULL REFERENCES catalog_studio(slug) ON DELETE RESTRICT,
  PRIMARY KEY (media_id, studio_slug)
);

CREATE TABLE media_platform_link (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id uuid NOT NULL REFERENCES media(id) ON DELETE CASCADE,
  platform_slug text NOT NULL REFERENCES catalog_platform(slug) ON DELETE RESTRICT,
  region_code char(2) NOT NULL DEFAULT 'ID',
  url text NOT NULL,
  language text NOT NULL DEFAULT 'UNKNOWN',
  access_type text NOT NULL DEFAULT 'SEARCH',
  status text NOT NULL DEFAULT 'SEARCH_ONLY',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT media_platform_link_https CHECK (url ~ '^https://'),
  CONSTRAINT media_platform_link_language CHECK (language IN ('SUB', 'DUB', 'SUB_DUB', 'RAW', 'UNKNOWN')),
  CONSTRAINT media_platform_link_access CHECK (access_type IN ('FREE', 'SUBSCRIPTION', 'RENTAL', 'PURCHASE', 'SEARCH', 'UNKNOWN')),
  CONSTRAINT media_platform_link_status CHECK (status IN ('ACTIVE', 'STALE', 'BROKEN', 'REMOVED', 'SEARCH_ONLY')),
  CONSTRAINT media_platform_link_unique UNIQUE (media_id, platform_slug, region_code, language)
);

CREATE INDEX media_genre_slug_idx ON media_genre (genre_slug, media_id);
CREATE INDEX media_studio_slug_idx ON media_studio (studio_slug, media_id);
CREATE INDEX media_platform_link_media_idx ON media_platform_link (media_id, status);
CREATE INDEX media_platform_link_platform_idx ON media_platform_link (platform_slug, status);
