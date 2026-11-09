import "server-only";

import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import seedData from "@/data/seed.json";

const SCHEMA_VERSION = 1;
const DB_PATH = process.env.NIMELIST_DB_PATH ?? path.join(process.cwd(), "data", "nimelist.db");

type SeedGenre = { id: number; slug: string; name: string; nameId: string; description: string };
type SeedPlatform = {
  id: number;
  slug: string;
  name: string;
  websiteUrl: string;
  searchUrlTemplate: string;
  color: string;
  description: string;
  sortOrder: number;
};
type SeedStudio = { id: number; slug: string; name: string };
type SeedMedia = (typeof seedData.media)[number];

type GlobalWithDb = typeof globalThis & {
  __nimelistDb?: DatabaseSync;
};

const globalForDb = globalThis as GlobalWithDb;

function schemaSql(): string {
  return `
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;

    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS media (
      id INTEGER PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title_romaji TEXT NOT NULL,
      title_english TEXT,
      title_native TEXT,
      title_id TEXT,
      synonyms_json TEXT NOT NULL DEFAULT '[]',
      synopsis_id TEXT,
      format TEXT NOT NULL,
      status TEXT NOT NULL,
      season TEXT,
      season_year INTEGER,
      episodes INTEGER,
      duration_minutes INTEGER,
      score_avg REAL,
      popularity INTEGER NOT NULL DEFAULT 0,
      cover_url TEXT,
      banner_url TEXT,
      is_adult INTEGER NOT NULL DEFAULT 0,
      content_status TEXT NOT NULL DEFAULT 'MISSING',
      source TEXT NOT NULL,
      source_url TEXT,
      updated_at TEXT NOT NULL,
      genre_slugs_json TEXT NOT NULL DEFAULT '[]',
      studio_slugs_json TEXT NOT NULL DEFAULT '[]',
      platform_slugs_json TEXT NOT NULL DEFAULT '[]',
      search_text TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS genre (
      id INTEGER PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      name_id TEXT NOT NULL,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS media_genre (
      media_id INTEGER NOT NULL REFERENCES media(id) ON DELETE CASCADE,
      genre_id INTEGER NOT NULL REFERENCES genre(id) ON DELETE CASCADE,
      PRIMARY KEY (media_id, genre_id)
    );

    CREATE TABLE IF NOT EXISTS studio (
      id INTEGER PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS media_studio (
      media_id INTEGER NOT NULL REFERENCES media(id) ON DELETE CASCADE,
      studio_id INTEGER NOT NULL REFERENCES studio(id) ON DELETE CASCADE,
      PRIMARY KEY (media_id, studio_id)
    );

    CREATE TABLE IF NOT EXISTS platform (
      id INTEGER PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      website_url TEXT NOT NULL,
      search_url_template TEXT NOT NULL,
      color TEXT NOT NULL,
      description TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS streaming_link (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      media_id INTEGER NOT NULL REFERENCES media(id) ON DELETE CASCADE,
      platform_id INTEGER NOT NULL REFERENCES platform(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      language TEXT NOT NULL DEFAULT 'UNKNOWN',
      access_type TEXT NOT NULL DEFAULT 'SEARCH',
      status TEXT NOT NULL DEFAULT 'SEARCH_ONLY',
      note TEXT,
      last_verified_at TEXT
    );

    CREATE TABLE IF NOT EXISTS schedule_slot (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      media_id INTEGER NOT NULL REFERENCES media(id) ON DELETE CASCADE,
      day_of_week INTEGER NOT NULL,
      time_wib TEXT NOT NULL,
      base_episode INTEGER NOT NULL,
      base_date TEXT NOT NULL DEFAULT '2026-11-09',
      episodes INTEGER,
      confidence TEXT NOT NULL DEFAULT 'ESTIMATED',
      source TEXT NOT NULL DEFAULT 'manual'
    );

    CREATE INDEX IF NOT EXISTS idx_media_season ON media(season, season_year);
    CREATE INDEX IF NOT EXISTS idx_media_status ON media(status);
    CREATE INDEX IF NOT EXISTS idx_media_score ON media(score_avg DESC);
    CREATE INDEX IF NOT EXISTS idx_media_popularity ON media(popularity DESC);
    CREATE INDEX IF NOT EXISTS idx_media_genre_genre ON media_genre(genre_id, media_id);
    CREATE INDEX IF NOT EXISTS idx_media_studio_studio ON media_studio(studio_id, media_id);
    CREATE INDEX IF NOT EXISTS idx_streaming_media ON streaming_link(media_id);
    CREATE INDEX IF NOT EXISTS idx_streaming_platform ON streaming_link(platform_id, media_id);
    CREATE INDEX IF NOT EXISTS idx_schedule_day ON schedule_slot(day_of_week, time_wib);
  `;
}

function clearSchema(db: DatabaseSync): void {
  db.exec(`
    PRAGMA foreign_keys = OFF;
    DROP TABLE IF EXISTS schedule_slot;
    DROP TABLE IF EXISTS streaming_link;
    DROP TABLE IF EXISTS media_studio;
    DROP TABLE IF EXISTS media_genre;
    DROP TABLE IF EXISTS platform;
    DROP TABLE IF EXISTS studio;
    DROP TABLE IF EXISTS genre;
    DROP TABLE IF EXISTS media;
    DROP TABLE IF EXISTS meta;
    PRAGMA foreign_keys = ON;
  `);
}

function seedDatabase(db: DatabaseSync): void {
  const genres = seedData.genres as SeedGenre[];
  const platforms = seedData.platforms as SeedPlatform[];
  const studios = seedData.studios as SeedStudio[];
  const media = seedData.media as SeedMedia[];

  const genreIdBySlug = new Map(genres.map((genre) => [genre.slug, genre.id]));
  const studioIdBySlug = new Map(studios.map((studio) => [studio.slug, studio.id]));
  const platformIdBySlug = new Map(platforms.map((platform) => [platform.slug, platform.id]));

  db.exec("BEGIN IMMEDIATE");

  try {
    db.exec("DELETE FROM schedule_slot; DELETE FROM streaming_link; DELETE FROM media_studio; DELETE FROM media_genre; DELETE FROM platform; DELETE FROM studio; DELETE FROM genre; DELETE FROM media; DELETE FROM meta;");

    const insertMeta = db.prepare("INSERT INTO meta (key, value) VALUES (?, ?)");
    insertMeta.run("schema_version", String(SCHEMA_VERSION));
    insertMeta.run("seed_version", seedData.generatedAt);
    insertMeta.run("seed_source", seedData.source.release);
    insertMeta.run("seed_license", seedData.source.license);

    const insertGenre = db.prepare(
      "INSERT INTO genre (id, slug, name, name_id, description) VALUES (?, ?, ?, ?, ?)",
    );
    for (const genre of genres) {
      insertGenre.run(genre.id, genre.slug, genre.name, genre.nameId, genre.description);
    }

    const insertStudio = db.prepare("INSERT INTO studio (id, slug, name) VALUES (?, ?, ?)");
    for (const studio of studios) {
      insertStudio.run(studio.id, studio.slug, studio.name);
    }

    const insertPlatform = db.prepare(
      "INSERT INTO platform (id, slug, name, website_url, search_url_template, color, description, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    );
    for (const platform of platforms) {
      insertPlatform.run(
        platform.id,
        platform.slug,
        platform.name,
        platform.websiteUrl,
        platform.searchUrlTemplate,
        platform.color,
        platform.description,
        platform.sortOrder,
      );
    }

    const insertMedia = db.prepare(`
      INSERT INTO media (
        id, slug, title_romaji, title_english, title_native, title_id, synonyms_json,
        synopsis_id, format, status, season, season_year, episodes, duration_minutes,
        score_avg, popularity, cover_url, banner_url, is_adult, content_status,
        source, source_url, updated_at, genre_slugs_json, studio_slugs_json,
        platform_slugs_json, search_text
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertMediaGenre = db.prepare(
      "INSERT OR IGNORE INTO media_genre (media_id, genre_id) VALUES (?, ?)",
    );
    const insertMediaStudio = db.prepare(
      "INSERT OR IGNORE INTO media_studio (media_id, studio_id) VALUES (?, ?)",
    );
    const insertStreaming = db.prepare(
      "INSERT INTO streaming_link (media_id, platform_id, url, language, access_type, status, note, last_verified_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    );
    const insertSchedule = db.prepare(
      "INSERT INTO schedule_slot (media_id, day_of_week, time_wib, base_episode, base_date, episodes, confidence, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    );

    media.forEach((item, index) => {
      const id = index + 1;
      const platformSlugs = [...new Set(item.streaming.map((link) => link.platformSlug))];
      const genreNames = item.genres
        .map((slug) => genres.find((genre) => genre.slug === slug))
        .filter(Boolean)
        .map((genre) => `${genre!.name} ${genre!.nameId}`);
      const studioNames = item.studios
        .map((slug) => studios.find((studio) => studio.slug === slug))
        .filter(Boolean)
        .map((studio) => studio!.name);
      const searchText = [
        item.titleRomaji,
        item.titleId,
        item.titleEnglish,
        ...(item.synonyms ?? []),
        ...genreNames,
        ...studioNames,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      insertMedia.run(
        id,
        item.slug,
        item.titleRomaji,
        item.titleEnglish,
        item.titleNative,
        item.titleId,
        JSON.stringify(item.synonyms ?? []),
        item.synopsisId,
        item.format,
        item.status,
        item.season,
        item.seasonYear,
        item.episodes,
        item.durationMinutes,
        item.scoreAvg,
        item.popularity,
        item.coverUrl,
        item.bannerUrl,
        item.isAdult,
        item.contentStatus,
        item.source,
        item.sourceUrl,
        item.updatedAt,
        JSON.stringify(item.genres),
        JSON.stringify(item.studios),
        JSON.stringify(platformSlugs),
        searchText,
      );

      for (const genreSlug of item.genres) {
        const genreId = genreIdBySlug.get(genreSlug);
        if (genreId) insertMediaGenre.run(id, genreId);
      }
      for (const studioSlug of item.studios) {
        const studioId = studioIdBySlug.get(studioSlug);
        if (studioId) insertMediaStudio.run(id, studioId);
      }
      for (const link of item.streaming) {
        const platformId = platformIdBySlug.get(link.platformSlug);
        if (platformId) {
          insertStreaming.run(
            id,
            platformId,
            link.url,
            link.language,
            link.accessType,
            link.status,
            link.note,
            null,
          );
        }
      }
      if (item.schedule) {
        insertSchedule.run(
          id,
          item.schedule.dayOfWeek,
          item.schedule.timeWib,
          item.schedule.baseEpisode,
          item.schedule.baseDate,
          item.schedule.episodes,
          item.schedule.confidence,
          item.schedule.source,
        );
      }
    });

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

function initializeDatabase(): DatabaseSync {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec(schemaSql());

  const schemaVersion = db.prepare("PRAGMA user_version").get() as
    | { user_version?: number }
    | undefined;
  const seedVersion = db
    .prepare("SELECT value FROM meta WHERE key = 'seed_version'")
    .get() as { value?: string } | undefined;
  const mediaCount = db.prepare("SELECT COUNT(*) AS count FROM media").get() as
    | { count: number }
    | undefined;

  const needsRebuild =
    (schemaVersion?.user_version ?? 0) !== SCHEMA_VERSION ||
    seedVersion?.value !== seedData.generatedAt ||
    !mediaCount?.count;

  if (needsRebuild) {
    clearSchema(db);
    db.exec(schemaSql());
    db.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);
    seedDatabase(db);
    db.exec(`PRAGMA user_version = ${SCHEMA_VERSION}`);
  }

  return db;
}

export function getDb(): DatabaseSync {
  if (!globalForDb.__nimelistDb) {
    globalForDb.__nimelistDb = initializeDatabase();
  }
  return globalForDb.__nimelistDb;
}

export { DB_PATH };
