import "server-only";

import { cacheLife, cacheTag } from "next/cache";
import { getDb } from "@/lib/db";
import type {
  CatalogFacets,
  CatalogFilters,
  Genre,
  MediaDetail,
  MediaListResult,
  MediaSummary,
  Platform,
  ScheduleItem,
  ScheduleOccurrence,
  Studio,
  StreamingLink,
} from "@/lib/types";
import {
  addDays,
  isoDayOfWeek,
  seasonSlug,
  startOfWeek,
  toJakartaDateString,
  weekDates,
} from "@/lib/utils";

type Row = Record<string, unknown>;

interface Taxonomy {
  genres: Map<string, Genre>;
  studios: Map<string, Studio>;
  platforms: Map<string, Platform>;
}

interface ScheduleRow extends Row {
  slot_id: number;
  day_of_week: number;
  time_wib: string;
  base_episode: number;
  base_date: string;
  slot_episodes: number | null;
  slot_confidence: string;
  slot_source: string;
}

function parseJsonArray<T>(value: unknown): T[] {
  if (typeof value !== "string" || value.length === 0) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function loadTaxonomy(): Taxonomy {
  const db = getDb();
  const genreRows = db
    .prepare("SELECT id, slug, name, name_id, description FROM genre ORDER BY name_id")
    .all() as Row[];
  const studioRows = db.prepare("SELECT id, slug, name FROM studio ORDER BY name").all() as Row[];
  const platformRows = db
    .prepare(
      "SELECT id, slug, name, website_url, search_url_template, color, description, sort_order FROM platform ORDER BY sort_order",
    )
    .all() as Row[];

  return {
    genres: new Map(
      genreRows.map((row) => [
        String(row.slug),
        {
          id: Number(row.id),
          slug: String(row.slug),
          name: String(row.name),
          nameId: String(row.name_id),
          description: (row.description as string | null) ?? null,
        },
      ]),
    ),
    studios: new Map(
      studioRows.map((row) => [
        String(row.slug),
        { id: Number(row.id), slug: String(row.slug), name: String(row.name) },
      ]),
    ),
    platforms: new Map(
      platformRows.map((row) => [
        String(row.slug),
        {
          id: Number(row.id),
          slug: String(row.slug),
          name: String(row.name),
          websiteUrl: String(row.website_url),
          searchUrlTemplate: String(row.search_url_template),
          color: String(row.color),
          description: String(row.description),
          sortOrder: Number(row.sort_order),
        },
      ]),
    ),
  };
}

function toMediaSummary(row: Row, taxonomy: Taxonomy): MediaSummary {
  const genreSlugs = parseJsonArray<string>(row.genre_slugs_json);
  const studioSlugs = parseJsonArray<string>(row.studio_slugs_json);
  const platformSlugs = parseJsonArray<string>(row.platform_slugs_json);
  const titleId = (row.title_id as string | null) ?? null;
  const titleRomaji = String(row.title_romaji);

  return {
    id: Number(row.id),
    slug: String(row.slug),
    title: titleId ?? titleRomaji,
    titleRomaji,
    titleEnglish: (row.title_english as string | null) ?? null,
    titleId,
    synopsisId: (row.synopsis_id as string | null) ?? null,
    format: String(row.format),
    status: String(row.status),
    season: (row.season as string | null) ?? null,
    seasonYear: row.season_year == null ? null : Number(row.season_year),
    episodes: row.episodes == null ? null : Number(row.episodes),
    durationMinutes: row.duration_minutes == null ? null : Number(row.duration_minutes),
    scoreAvg: row.score_avg == null ? null : Number(row.score_avg),
    popularity: Number(row.popularity ?? 0),
    coverUrl: (row.cover_url as string | null) ?? null,
    isAdult: Boolean(row.is_adult),
    contentStatus: String(row.content_status),
    genres: genreSlugs.map((slug) => taxonomy.genres.get(slug)).filter((genre): genre is Genre => Boolean(genre)),
    studios: studioSlugs
      .map((slug) => taxonomy.studios.get(slug))
      .filter((studio): studio is Studio => Boolean(studio)),
    platforms: platformSlugs
      .map((slug) => taxonomy.platforms.get(slug))
      .filter((platform): platform is Platform => Boolean(platform)),
  };
}

function weeksBetween(baseDate: string, date: string): number {
  const base = new Date(`${baseDate}T00:00:00Z`).getTime();
  const target = new Date(`${date}T00:00:00Z`).getTime();
  return Math.floor((target - base) / (7 * 24 * 60 * 60 * 1000));
}

function occurrenceForDate(row: ScheduleRow, date: string): ScheduleOccurrence | null {
  const episodeNumber = Number(row.base_episode) + weeksBetween(String(row.base_date), date);
  const totalEpisodes = row.slot_episodes == null ? null : Number(row.slot_episodes);
  if (episodeNumber < 1 || (totalEpisodes !== null && episodeNumber > totalEpisodes)) {
    return null;
  }
  return {
    id: Number(row.slot_id),
    dayOfWeek: Number(row.day_of_week),
    timeWib: String(row.time_wib),
    baseEpisode: Number(row.base_episode),
    episodes: totalEpisodes,
    confidence: String(row.slot_confidence),
    source: String(row.slot_source),
    date,
    episodeNumber,
  };
}

const MEDIA_SELECT = `
  m.id, m.slug, m.title_romaji, m.title_english, m.title_native, m.title_id,
  m.synopsis_id, m.format, m.status, m.season, m.season_year, m.episodes,
  m.duration_minutes, m.score_avg, m.popularity, m.cover_url, m.banner_url,
  m.is_adult, m.content_status, m.source, m.source_url, m.updated_at,
  m.genre_slugs_json, m.studio_slugs_json, m.platform_slugs_json
`;

function buildWhere(filters: CatalogFilters): { clause: string; params: (string | number)[] } {
  const conditions: string[] = ["m.is_adult = 0"];
  const params: (string | number)[] = [];

  const q = filters.q?.trim().toLowerCase();
  if (q) {
    for (const term of q.split(/\s+/).slice(0, 5)) {
      conditions.push("(m.search_text LIKE ? OR m.slug LIKE ?)");
      params.push(`%${term}%`, `%${term}%`);
    }
  }
  if (filters.genre) {
    conditions.push(
      "EXISTS (SELECT 1 FROM media_genre mg JOIN genre g ON g.id = mg.genre_id WHERE mg.media_id = m.id AND g.slug = ?)",
    );
    params.push(filters.genre);
  }
  if (filters.studio) {
    conditions.push(
      "EXISTS (SELECT 1 FROM media_studio ms JOIN studio s ON s.id = ms.studio_id WHERE ms.media_id = m.id AND s.slug = ?)",
    );
    params.push(filters.studio);
  }
  if (filters.platform) {
    conditions.push(
      "EXISTS (SELECT 1 FROM streaming_link sl JOIN platform p ON p.id = sl.platform_id WHERE sl.media_id = m.id AND p.slug = ?)",
    );
    params.push(filters.platform);
  }
  if (filters.season) {
    conditions.push("m.season = ?");
    params.push(filters.season.toUpperCase());
  }
  if (filters.year) {
    conditions.push("m.season_year = ?");
    params.push(filters.year);
  }
  if (filters.status) {
    conditions.push("m.status = ?");
    params.push(filters.status.toUpperCase());
  }
  if (filters.format) {
    conditions.push("m.format = ?");
    params.push(filters.format.toUpperCase());
  }
  if (filters.contentStatus) {
    conditions.push("m.content_status = ?");
    params.push(filters.contentStatus.toUpperCase());
  }

  return { clause: `WHERE ${conditions.join(" AND ")}`, params };
}

function orderBy(sort: string | undefined): string {
  switch (sort) {
    case "skor":
      return "ORDER BY (m.score_avg IS NULL) ASC, m.score_avg DESC, m.popularity DESC, m.title_romaji ASC";
    case "judul":
      return "ORDER BY COALESCE(m.title_id, m.title_romaji) COLLATE NOCASE ASC";
    case "terbaru":
      return "ORDER BY m.season_year DESC, CASE m.season WHEN 'FALL' THEN 4 WHEN 'SUMMER' THEN 3 WHEN 'SPRING' THEN 2 WHEN 'WINTER' THEN 1 ELSE 0 END DESC, m.title_romaji ASC";
    default:
      return "ORDER BY m.popularity DESC, (m.score_avg IS NULL) ASC, m.score_avg DESC, m.title_romaji ASC";
  }
}

export async function listMedia(filters: CatalogFilters = {}): Promise<MediaListResult> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");

  const db = getDb();
  const taxonomy = loadTaxonomy();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(60, Math.max(1, filters.pageSize ?? 24));
  const { clause, params } = buildWhere(filters);

  const countRow = db
    .prepare(`SELECT COUNT(*) AS count FROM media m ${clause}`)
    .get(...params) as { count: number } | undefined;
  const total = Number(countRow?.count ?? 0);

  const rows = db
    .prepare(
      `SELECT ${MEDIA_SELECT} FROM media m ${clause} ${orderBy(filters.sort)} LIMIT ? OFFSET ?`,
    )
    .all(...params, pageSize, (page - 1) * pageSize) as Row[];

  return {
    items: rows.map((row) => toMediaSummary(row, taxonomy)),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getMediaBySlug(slug: string): Promise<MediaDetail | null> {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");
  cacheTag(`media:${slug}`);

  const db = getDb();
  const taxonomy = loadTaxonomy();
  const row = db
    .prepare(`SELECT ${MEDIA_SELECT} FROM media m WHERE m.slug = ? AND m.is_adult = 0`)
    .get(slug) as Row | undefined;
  if (!row) return null;

  const summary = toMediaSummary(row, taxonomy);
  const streamingRows = db
    .prepare(
      `SELECT sl.url, sl.language, sl.access_type, sl.status, sl.note, sl.last_verified_at,
              p.id AS platform_id, p.slug AS platform_slug, p.name AS platform_name,
              p.website_url, p.search_url_template, p.color, p.description, p.sort_order
       FROM streaming_link sl
       JOIN platform p ON p.id = sl.platform_id
       WHERE sl.media_id = ?
       ORDER BY p.sort_order`,
    )
    .all(summary.id) as Row[];

  const streaming: StreamingLink[] = streamingRows.map((link) => ({
    platform: {
      id: Number(link.platform_id),
      slug: String(link.platform_slug),
      name: String(link.platform_name),
      websiteUrl: String(link.website_url),
      searchUrlTemplate: String(link.search_url_template),
      color: String(link.color),
      description: String(link.description),
      sortOrder: Number(link.sort_order),
    },
    url: String(link.url),
    language: String(link.language),
    accessType: String(link.access_type),
    status: String(link.status),
    note: (link.note as string | null) ?? null,
    lastVerifiedAt: (link.last_verified_at as string | null) ?? null,
  }));

  const scheduleRows = db
    .prepare(
      `SELECT id AS slot_id, day_of_week, time_wib, base_episode, base_date,
              episodes AS slot_episodes, confidence AS slot_confidence, source AS slot_source
       FROM schedule_slot WHERE media_id = ? ORDER BY day_of_week, time_wib`,
    )
    .all(summary.id) as ScheduleRow[];

  const scheduleSlots: ScheduleOccurrence[] = [];
  const today = toJakartaDateString();
  for (const slot of scheduleRows) {
    let date = today;
    for (let i = 0; i < 7 && isoDayOfWeek(date) !== Number(slot.day_of_week); i += 1) {
      date = addDays(date, 1);
    }
    for (let week = 0; week < 3; week += 1) {
      const occurrence = occurrenceForDate(slot, addDays(date, week * 7));
      if (occurrence) scheduleSlots.push(occurrence);
    }
  }

  return {
    ...summary,
    titleNative: (row.title_native as string | null) ?? null,
    synonyms: parseJsonArray<string>(row.synonyms_json),
    source: String(row.source),
    sourceUrl: (row.source_url as string | null) ?? null,
    updatedAt: String(row.updated_at),
    streaming,
    scheduleSlots,
  };
}

export async function getGenres(): Promise<Genre[]> {
  "use cache";
  cacheLife("days");
  cacheTag("catalog");

  const rows = getDb()
    .prepare(
      `SELECT g.id, g.slug, g.name, g.name_id, g.description, COUNT(m.id) AS count
       FROM genre g
       LEFT JOIN media_genre mg ON mg.genre_id = g.id
       LEFT JOIN media m ON m.id = mg.media_id AND m.is_adult = 0
       GROUP BY g.id
       ORDER BY count DESC, g.name_id ASC`,
    )
    .all() as Row[];

  return rows.map((row) => ({
    id: Number(row.id),
    slug: String(row.slug),
    name: String(row.name),
    nameId: String(row.name_id),
    description: (row.description as string | null) ?? null,
    count: Number(row.count ?? 0),
  }));
}

export async function getGenreBySlug(slug: string): Promise<Genre | null> {
  "use cache";
  cacheLife("days");
  cacheTag("catalog");

  const row = getDb()
    .prepare(
      `SELECT g.id, g.slug, g.name, g.name_id, g.description, COUNT(m.id) AS count
       FROM genre g
       LEFT JOIN media_genre mg ON mg.genre_id = g.id
       LEFT JOIN media m ON m.id = mg.media_id AND m.is_adult = 0
       WHERE g.slug = ? GROUP BY g.id`,
    )
    .get(slug) as Row | undefined;
  if (!row) return null;
  return {
    id: Number(row.id),
    slug: String(row.slug),
    name: String(row.name),
    nameId: String(row.name_id),
    description: (row.description as string | null) ?? null,
    count: Number(row.count ?? 0),
  };
}

export async function getStudios(): Promise<Studio[]> {
  "use cache";
  cacheLife("days");
  cacheTag("catalog");

  const rows = getDb()
    .prepare(
      `SELECT s.id, s.slug, s.name, COUNT(m.id) AS count
       FROM studio s
       LEFT JOIN media_studio ms ON ms.studio_id = s.id
       LEFT JOIN media m ON m.id = ms.media_id AND m.is_adult = 0
       GROUP BY s.id ORDER BY count DESC, s.name ASC`,
    )
    .all() as Row[];
  return rows.map((row) => ({
    id: Number(row.id),
    slug: String(row.slug),
    name: String(row.name),
    count: Number(row.count ?? 0),
  }));
}

export async function getStudioBySlug(slug: string): Promise<Studio | null> {
  "use cache";
  cacheLife("days");
  cacheTag("catalog");

  const row = getDb()
    .prepare(
      `SELECT s.id, s.slug, s.name, COUNT(m.id) AS count
       FROM studio s
       LEFT JOIN media_studio ms ON ms.studio_id = s.id
       LEFT JOIN media m ON m.id = ms.media_id AND m.is_adult = 0
       WHERE s.slug = ? GROUP BY s.id`,
    )
    .get(slug) as Row | undefined;
  if (!row) return null;
  return {
    id: Number(row.id),
    slug: String(row.slug),
    name: String(row.name),
    count: Number(row.count ?? 0),
  };
}

export async function getPlatforms(): Promise<Platform[]> {
  "use cache";
  cacheLife("days");
  cacheTag("catalog");

  const rows = getDb()
    .prepare(
      `SELECT p.id, p.slug, p.name, p.website_url, p.search_url_template, p.color,
              p.description, p.sort_order, COUNT(sl.id) AS count
       FROM platform p
       LEFT JOIN streaming_link sl ON sl.platform_id = p.id
       GROUP BY p.id ORDER BY p.sort_order ASC`,
    )
    .all() as Row[];
  return rows.map((row) => ({
    id: Number(row.id),
    slug: String(row.slug),
    name: String(row.name),
    websiteUrl: String(row.website_url),
    searchUrlTemplate: String(row.search_url_template),
    color: String(row.color),
    description: String(row.description),
    sortOrder: Number(row.sort_order),
    count: Number(row.count ?? 0),
  }));
}

export async function getPlatformBySlug(slug: string): Promise<Platform | null> {
  "use cache";
  cacheLife("days");
  cacheTag("catalog");

  const row = getDb()
    .prepare(
      `SELECT p.id, p.slug, p.name, p.website_url, p.search_url_template, p.color,
              p.description, p.sort_order, COUNT(sl.id) AS count
       FROM platform p
       LEFT JOIN streaming_link sl ON sl.platform_id = p.id
       WHERE p.slug = ? GROUP BY p.id`,
    )
    .get(slug) as Row | undefined;
  if (!row) return null;
  return {
    id: Number(row.id),
    slug: String(row.slug),
    name: String(row.name),
    websiteUrl: String(row.website_url),
    searchUrlTemplate: String(row.search_url_template),
    color: String(row.color),
    description: String(row.description),
    sortOrder: Number(row.sort_order),
    count: Number(row.count ?? 0),
  };
}

export async function getSeasons(): Promise<{ season: string; year: number; count: number }[]> {
  "use cache";
  cacheLife("days");
  cacheTag("catalog");

  const rows = getDb()
    .prepare(
      `SELECT season, season_year, COUNT(*) AS count FROM media
       WHERE season IS NOT NULL AND season_year IS NOT NULL AND is_adult = 0
       GROUP BY season, season_year
       ORDER BY season_year DESC,
         CASE season WHEN 'FALL' THEN 4 WHEN 'SUMMER' THEN 3 WHEN 'SPRING' THEN 2 WHEN 'WINTER' THEN 1 ELSE 0 END DESC`,
    )
    .all() as Row[];
  return rows.map((row) => ({
    season: String(row.season),
    year: Number(row.season_year),
    count: Number(row.count ?? 0),
  }));
}

export async function getSeasonSummary(
  season: string,
  year: number,
): Promise<{ season: string; year: number; count: number; reviewed: number } | null> {
  "use cache";
  cacheLife("days");
  cacheTag("catalog");

  const row = getDb()
    .prepare(
      `SELECT COUNT(*) AS count, SUM(CASE WHEN content_status = 'REVIEWED' THEN 1 ELSE 0 END) AS reviewed
       FROM media WHERE season = ? AND season_year = ? AND is_adult = 0`,
    )
    .get(season.toUpperCase(), year) as Row | undefined;
  if (!row || Number(row.count ?? 0) === 0) return null;
  return {
    season: season.toUpperCase(),
    year,
    count: Number(row.count ?? 0),
    reviewed: Number(row.reviewed ?? 0),
  };
}

export async function getCatalogFacets(): Promise<CatalogFacets> {
  "use cache";
  cacheLife("days");
  cacheTag("catalog");

  const [genres, studios, platforms, seasons] = await Promise.all([
    getGenres(),
    getStudios(),
    getPlatforms(),
    getSeasons(),
  ]);
  return { genres, studios, platforms, seasons };
}

export async function getRelatedMedia(
  mediaId: number,
  genreSlugs: string[],
  limit = 6,
): Promise<MediaSummary[]> {
  "use cache";
  cacheLife("days");
  cacheTag("catalog");

  if (genreSlugs.length === 0) return [];
  const db = getDb();
  const taxonomy = loadTaxonomy();
  const selectedGenres = genreSlugs.slice(0, 4);
  const placeholders = selectedGenres.map(() => "?").join(", ");
  const rows = db
    .prepare(
      `SELECT ${MEDIA_SELECT}
       FROM media m
       JOIN media_genre mg ON mg.media_id = m.id
       JOIN genre g ON g.id = mg.genre_id
       WHERE g.slug IN (${placeholders}) AND m.id != ? AND m.is_adult = 0
       GROUP BY m.id
       ORDER BY (m.score_avg IS NULL) ASC, m.score_avg DESC, m.popularity DESC
       LIMIT ?`,
    )
    .all(...selectedGenres, mediaId, limit) as Row[];
  return rows.map((row) => toMediaSummary(row, taxonomy));
}

export async function getScheduleForDate(date: string): Promise<ScheduleItem[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("schedule");
  cacheTag(`schedule:${date}`);

  const db = getDb();
  const taxonomy = loadTaxonomy();
  const day = isoDayOfWeek(date);
  const rows = db
    .prepare(
      `SELECT s.id AS slot_id, s.day_of_week, s.time_wib, s.base_episode, s.base_date,
              s.episodes AS slot_episodes, s.confidence AS slot_confidence, s.source AS slot_source,
              ${MEDIA_SELECT}
       FROM schedule_slot s
       JOIN media m ON m.id = s.media_id
       WHERE s.day_of_week = ? AND m.is_adult = 0
       ORDER BY s.time_wib ASC, m.popularity DESC`,
    )
    .all(day) as ScheduleRow[];

  const items: ScheduleItem[] = [];
  for (const row of rows) {
    const occurrence = occurrenceForDate(row, date);
    if (!occurrence) continue;
    items.push({
      ...occurrence,
      media: toMediaSummary(row, taxonomy),
    });
  }
  return items;
}

export async function getWeekSchedule(
  startDate: string,
): Promise<{ date: string; items: ScheduleItem[] }[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("schedule");

  const db = getDb();
  const taxonomy = loadTaxonomy();
  const dates = weekDates(startDate);
  const days = dates.map((date) => isoDayOfWeek(date));
  const placeholders = days.map(() => "?").join(", ");
  const rows = db
    .prepare(
      `SELECT s.id AS slot_id, s.day_of_week, s.time_wib, s.base_episode, s.base_date,
              s.episodes AS slot_episodes, s.confidence AS slot_confidence, s.source AS slot_source,
              ${MEDIA_SELECT}
       FROM schedule_slot s
       JOIN media m ON m.id = s.media_id
       WHERE s.day_of_week IN (${placeholders}) AND m.is_adult = 0
       ORDER BY s.time_wib ASC, m.popularity DESC`,
    )
    .all(...days) as ScheduleRow[];

  return dates.map((date) => {
    const day = isoDayOfWeek(date);
    const items: ScheduleItem[] = [];
    for (const row of rows) {
      if (Number(row.day_of_week) !== day) continue;
      const occurrence = occurrenceForDate(row, date);
      if (!occurrence) continue;
      items.push({ ...occurrence, media: toMediaSummary(row, taxonomy) });
    }
    return { date, items };
  });
}

export async function getTodaySchedule(): Promise<{
  date: string;
  items: ScheduleItem[];
}> {
  "use cache";
  cacheLife("minutes");
  cacheTag("schedule");

  const date = toJakartaDateString();
  return { date, items: await getScheduleForDate(date) };
}

export async function getSeasonListForNavigation(): Promise<
  { season: string; year: number; slug: string; count: number }[]
> {
  const seasons = await getSeasons();
  return seasons.map((item) => ({
    ...item,
    slug: seasonSlug(item.season, item.year),
  }));
}

export async function searchSuggestions(
  query: string,
  limit = 8,
): Promise<
  { slug: string; title: string; coverUrl: string | null; score: number | null; season: string | null; seasonYear: number | null }[]
> {
  "use cache";
  cacheLife("minutes");
  cacheTag("search");

  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const rows = getDb()
    .prepare(
      `SELECT slug, COALESCE(title_id, title_romaji) AS title, cover_url, score_avg, season, season_year
       FROM media
       WHERE is_adult = 0 AND search_text LIKE ?
       ORDER BY popularity DESC, (score_avg IS NULL) ASC, score_avg DESC
       LIMIT ?`,
    )
    .all(`%${q}%`, Math.min(12, Math.max(1, limit))) as Row[];
  return rows.map((row) => ({
    slug: String(row.slug),
    title: String(row.title),
    coverUrl: (row.cover_url as string | null) ?? null,
    score: row.score_avg == null ? null : Number(row.score_avg),
    season: (row.season as string | null) ?? null,
    seasonYear: row.season_year == null ? null : Number(row.season_year),
  }));
}


export async function getAllMediaSlugs(): Promise<string[]> {
  "use cache";
  cacheLife("days");
  cacheTag("catalog");

  const rows = getDb()
    .prepare("SELECT slug FROM media WHERE is_adult = 0 ORDER BY popularity DESC")
    .all() as Row[];
  return rows.map((row) => String(row.slug));
}

export async function getIndexableMediaEntries(): Promise<
  { slug: string; updatedAt: string }[]
> {
  "use cache";
  cacheLife("days");
  cacheTag("sitemap");

  const rows = getDb()
    .prepare(
      "SELECT slug, updated_at FROM media WHERE is_adult = 0 AND content_status = 'REVIEWED' ORDER BY popularity DESC",
    )
    .all() as Row[];
  return rows.map((row) => ({
    slug: String(row.slug),
    updatedAt: String(row.updated_at),
  }));
}

export async function getSiteStats(): Promise<{
  media: number;
  reviewed: number;
  genres: number;
  platforms: number;
  currentSeason: number;
}> {
  "use cache";
  cacheLife("days");
  cacheTag("catalog");

  const row = getDb()
    .prepare(
      `SELECT COUNT(*) AS media,
              SUM(CASE WHEN content_status = 'REVIEWED' THEN 1 ELSE 0 END) AS reviewed,
              (SELECT COUNT(*) FROM genre) AS genres,
              (SELECT COUNT(*) FROM platform) AS platforms,
              SUM(CASE WHEN season = 'FALL' AND season_year = 2026 THEN 1 ELSE 0 END) AS current_season
       FROM media WHERE is_adult = 0`,
    )
    .get() as Row | undefined;
  return {
    media: Number(row?.media ?? 0),
    reviewed: Number(row?.reviewed ?? 0),
    genres: Number(row?.genres ?? 0),
    platforms: Number(row?.platforms ?? 0),
    currentSeason: Number(row?.current_season ?? 0),
  };
}


export async function getTodayDate(): Promise<string> {
  "use cache";
  cacheLife("minutes");
  return toJakartaDateString();
}

export async function getScheduleDateRange(): Promise<{ start: string; end: string }> {
  const today = await getTodayDate();
  const start = startOfWeek(today);
  return { start, end: addDays(start, 6) };
}
