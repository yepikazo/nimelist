import { createHash } from "node:crypto";
import { inTransaction, readJsonBody, requireServiceToken, ServiceError, startHttpService } from "../../../packages/service-runtime/src/index.mjs";
import { pool } from "./db.mjs";

const port = Number(process.env.PORT ?? 4103);
const maxQueryLength = 80;
const maxLimit = 30;

function fail(status, code, message) { throw new ServiceError(status, code, message); }
function database() {
  if (!pool) fail(503, "DATABASE_NOT_CONFIGURED", "DATABASE_URL Search belum dikonfigurasi.");
  return pool;
}

function normalizedText(value) {
  return (Array.isArray(value) ? value : []).filter((part) => typeof part === "string").join(" ").replace(/\s+/g, " ").trim();
}

function parseDocument(item) {
  if (!item || typeof item !== "object" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(item.mediaId ?? "")) fail(400, "INVALID_DOCUMENT", "mediaId harus UUID.");
  if (typeof item.slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.slug)) fail(400, "INVALID_DOCUMENT", "slug tidak valid.");
  if (typeof item.titleRomaji !== "string" || !item.titleRomaji.trim()) fail(400, "INVALID_DOCUMENT", "titleRomaji wajib diisi.");
  const fields = ["titleEnglish", "titleNative", "titleId", "coverUrl", "season", "format", "status"];
  for (const field of fields) if (item[field] != null && typeof item[field] !== "string") fail(400, "INVALID_DOCUMENT", `${field} harus berupa string atau null.`);
  for (const field of ["synonyms", "genres", "studios", "platforms"]) {
    if (item[field] != null && (!Array.isArray(item[field]) || item[field].some((value) => typeof value !== "string"))) fail(400, "INVALID_DOCUMENT", `${field} harus array string.`);
  }
  if (item.isAdult != null && typeof item.isAdult !== "boolean") fail(400, "INVALID_DOCUMENT", "isAdult harus boolean.");
  if (item.seasonYear != null && (!Number.isInteger(Number(item.seasonYear)) || Number(item.seasonYear) < 1900 || Number(item.seasonYear) > 2100)) fail(400, "INVALID_DOCUMENT", "seasonYear tidak valid.");
  if (item.scoreAvg != null && (!Number.isFinite(Number(item.scoreAvg)) || Number(item.scoreAvg) < 0 || Number(item.scoreAvg) > 10)) fail(400, "INVALID_DOCUMENT", "scoreAvg tidak valid.");
  if (item.popularity != null && (!Number.isInteger(Number(item.popularity)) || Number(item.popularity) < 0)) fail(400, "INVALID_DOCUMENT", "popularity tidak valid.");
  const sourceUpdatedAt = new Date(item.sourceUpdatedAt);
  if (!item.sourceUpdatedAt || Number.isNaN(sourceUpdatedAt.getTime())) fail(400, "INVALID_DOCUMENT", "sourceUpdatedAt wajib berupa tanggal yang valid.");
  const searchText = normalizedText([
    item.titleRomaji, item.titleEnglish, item.titleNative, item.titleId,
    ...(item.synonyms ?? []), ...(item.genres ?? []), ...(item.studios ?? []),
  ]);
  return {
    mediaId: item.mediaId,
    slug: item.slug,
    titleRomaji: item.titleRomaji.trim(),
    titleEnglish: item.titleEnglish ?? null,
    titleNative: item.titleNative ?? null,
    titleId: item.titleId ?? null,
    synonyms: item.synonyms ?? [],
    genres: item.genres ?? [],
    studios: item.studios ?? [],
    platforms: item.platforms ?? [],
    format: item.format ?? "UNKNOWN",
    status: item.status ?? "UNKNOWN",
    season: item.season ?? null,
    seasonYear: item.seasonYear ?? null,
    scoreAvg: item.scoreAvg ?? null,
    popularity: item.popularity ?? 0,
    coverUrl: item.coverUrl ?? null,
    isAdult: item.isAdult ?? false,
    sourceUpdatedAt: sourceUpdatedAt.toISOString(),
    searchText,
  };
}

const insertSql = `INSERT INTO search_document (
  media_id, slug, title_romaji, title_english, title_native, title_id, synonyms, genres, studios,
  platforms, format, status, season, season_year, score_avg, popularity, cover_url, is_adult, search_text, source_updated_at, updated_at
) VALUES ($1,$2,$3,$4,$5,$6,$7::text[],$8::text[],$9::text[],$10::text[],$11,$12,$13,$14,$15,$16,$17,$18,$19,$20::timestamptz,now())
ON CONFLICT (media_id) DO UPDATE SET
  slug=EXCLUDED.slug, title_romaji=EXCLUDED.title_romaji, title_english=EXCLUDED.title_english,
  title_native=EXCLUDED.title_native, title_id=EXCLUDED.title_id, synonyms=EXCLUDED.synonyms,
  genres=EXCLUDED.genres, studios=EXCLUDED.studios, platforms=EXCLUDED.platforms, format=EXCLUDED.format,
  status=EXCLUDED.status, season=EXCLUDED.season, season_year=EXCLUDED.season_year, score_avg=EXCLUDED.score_avg,
  popularity=EXCLUDED.popularity, cover_url=EXCLUDED.cover_url, is_adult=EXCLUDED.is_adult,
  search_text=EXCLUDED.search_text, source_updated_at=EXCLUDED.source_updated_at, updated_at=now()
WHERE EXCLUDED.source_updated_at >= search_document.source_updated_at`;

function valuesFor(document) {
  return [document.mediaId, document.slug, document.titleRomaji, document.titleEnglish, document.titleNative,
    document.titleId, document.synonyms, document.genres, document.studios, document.platforms,
    document.format, document.status, document.season, document.seasonYear, document.scoreAvg,
    document.popularity, document.coverUrl, document.isAdult, document.searchText, document.sourceUpdatedAt];
}

function parseCursor(cursor, queryHash) {
  if (!cursor) return 0;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    if (parsed.queryHash !== queryHash || !Number.isSafeInteger(parsed.offset) || parsed.offset < 0 || parsed.offset > 1000) throw new Error();
    return parsed.offset;
  } catch {
    fail(400, "INVALID_CURSOR", "Cursor tidak valid atau berasal dari query lain.");
  }
}

async function searchMedia(url) {
  const query = (url.searchParams.get("q") ?? "").trim().replace(/\s+/g, " ");
  if (query.length < 2) fail(400, "QUERY_TOO_SHORT", "q minimal 2 karakter.");
  if (query.length > maxQueryLength) fail(400, "QUERY_TOO_LONG", "q maksimal 80 karakter.");
  const limitValue = url.searchParams.get("limit") ?? "10";
  if (!/^\d+$/.test(limitValue) || Number(limitValue) < 1 || Number(limitValue) > maxLimit) fail(400, "INVALID_LIMIT", "limit harus 1–30.");
  const limit = Number(limitValue);
  const queryHash = createHash("sha256").update(query.toLocaleLowerCase("id-ID")).digest("hex").slice(0, 16);
  const offset = parseCursor(url.searchParams.get("cursor"), queryHash);
  if (offset + limit > 1000) fail(400, "CURSOR_LIMIT_EXCEEDED", "Pencarian dibatasi sampai 1.000 hasil.");
  const startedAt = performance.now();
  const rows = await inTransaction(database(), async (client) => {
    await client.query("SET LOCAL pg_trgm.similarity_threshold = 0.35");
    await client.query("SET LOCAL pg_trgm.word_similarity_threshold = 0.35");
    return client.query(`
    WITH query AS (SELECT websearch_to_tsquery('simple', $1) AS tsq), fts AS MATERIALIZED (
      SELECT d.*, ts_rank_cd(d.search_vector, query.tsq) AS text_rank,
        greatest(similarity(lower(d.title_romaji), lower($1)),
          similarity(lower(coalesce(d.title_english, '')), lower($1)),
          similarity(lower(coalesce(d.title_id, '')), lower($1))) AS trigram_rank
      FROM search_document d CROSS JOIN query
      WHERE d.is_adult = false AND d.search_vector @@ query.tsq
    ), fuzzy AS MATERIALIZED (
      SELECT d.*, 0::real AS text_rank,
        greatest(similarity(lower(d.title_romaji), lower($1)),
          similarity(lower(coalesce(d.title_english, '')), lower($1)),
          similarity(lower(coalesce(d.title_id, '')), lower($1)),
          word_similarity(lower($1), lower(d.title_romaji)),
          word_similarity(lower($1), lower(coalesce(d.title_english, ''))),
          word_similarity(lower($1), lower(coalesce(d.title_id, '')))) AS trigram_rank
      FROM search_document d
      WHERE d.is_adult = false AND NOT EXISTS (SELECT 1 FROM fts) AND (
        lower(d.title_romaji) % lower($1) OR lower(coalesce(d.title_english, '')) % lower($1)
        OR lower(coalesce(d.title_id, '')) % lower($1) OR lower($1) <% lower(d.title_romaji)
        OR lower($1) <% lower(coalesce(d.title_english, '')) OR lower($1) <% lower(coalesce(d.title_id, ''))
      )
    ), ranked AS (SELECT * FROM fts UNION ALL SELECT * FROM fuzzy)
    SELECT media_id, slug, title_romaji, title_english, title_id, cover_url,
      (CASE WHEN lower(title_romaji) = lower($1) OR lower(coalesce(title_english,'')) = lower($1) THEN 1.0 ELSE 0 END
       + text_rank * 0.7 + trigram_rank * 0.15 + ln(1 + popularity) * 0.002) AS score
    FROM ranked ORDER BY score DESC, popularity DESC, slug ASC LIMIT $2 OFFSET $3`,
      [query, limit + 1, offset],
    );
  });
  const hasMore = rows.rowCount > limit;
  const hits = rows.rows.slice(0, limit).map((row) => ({
    mediaId: String(row.media_id), slug: row.slug,
    title: row.title_id ?? row.title_romaji,
    titleRomaji: row.title_romaji,
    titleEnglish: row.title_english,
    coverUrl: row.cover_url,
    score: Number(row.score),
  }));
  const nextOffset = offset + hits.length;
  const nextCursor = hasMore ? Buffer.from(JSON.stringify({ queryHash, offset: nextOffset })).toString("base64url") : null;
  return { status: 200, body: { query, items: hits, nextCursor, hasMore, tookMs: Math.round(performance.now() - startedAt) } };
}

async function upsertDocuments(request) {
  requireServiceToken(request);
  const body = await readJsonBody(request);
  const items = Array.isArray(body) ? body : body?.items;
  if (!Array.isArray(items) || items.length < 1 || items.length > 100) fail(400, "INVALID_DOCUMENTS", "items harus berisi 1–100 dokumen.");
  const documents = items.map(parseDocument);
  await inTransaction(database(), async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", ["search:projection:catalog"]);
    for (const document of documents) await client.query(insertSql, valuesFor(document));
  });
  return { status: 202, body: { accepted: documents.length } };
}

async function rebuildIndex(request) {
  requireServiceToken(request);
  if (!process.env.CATALOG_SERVICE_URL) fail(503, "CATALOG_NOT_CONFIGURED", "Catalog Service URL belum dikonfigurasi.");
  const lockClient = await database().connect();
  try {
    await lockClient.query("SELECT pg_advisory_lock(hashtextextended($1, 0))", ["search:projection:catalog"]);
  const catalogUrl = process.env.CATALOG_SERVICE_URL.replace(/\/$/, "");
  const token = process.env.INTERNAL_API_TOKEN;
  await database().query("TRUNCATE search_document_staging");
  let offset = 0;
  let indexed = 0;
  const stageSql = insertSql.replace("INSERT INTO search_document (", "INSERT INTO search_document_staging (").split("\nON CONFLICT")[0];
  while (true) {
    const response = await fetch(`${catalogUrl}/internal/v1/search-documents?limit=200&offset=${offset}`, {
      headers: { authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15_000),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error?.message ?? `Catalog mengembalikan HTTP ${response.status}.`);
    if (!Array.isArray(result.items)) throw new Error("Catalog mengembalikan daftar dokumen yang tidak valid.");
    const documents = result.items.map(parseDocument);
    await inTransaction(database(), async (client) => {
      for (const document of documents) await client.query(stageSql, valuesFor(document));
    });
    indexed += documents.length;
    if (result.nextOffset == null) break;
    offset = result.nextOffset;
  }
  await inTransaction(database(), async (client) => {
    await client.query("TRUNCATE search_document");
    await client.query(`INSERT INTO search_document (
      media_id, slug, title_romaji, title_english, title_native, title_id, synonyms, genres, studios,
      platforms, format, status, season, season_year, score_avg, popularity, cover_url, is_adult, search_text, source_updated_at, updated_at
    ) SELECT media_id, slug, title_romaji, title_english, title_native, title_id, synonyms, genres, studios,
      platforms, format, status, season, season_year, score_avg, popularity, cover_url, is_adult, search_text, source_updated_at, updated_at
      FROM search_document_staging`);
    await client.query("TRUNCATE search_document_staging");
    await client.query(`INSERT INTO search_sync_state (source, last_reindexed_at, document_count)
      VALUES ('catalog', now(), $1) ON CONFLICT (source) DO UPDATE
      SET last_reindexed_at=EXCLUDED.last_reindexed_at, document_count=EXCLUDED.document_count`, [indexed]);
  });
  return { status: 200, body: { indexed, source: "catalog", completedAt: new Date().toISOString() } };
  } finally {
    try {
      await lockClient.query("SELECT pg_advisory_unlock(hashtextextended($1, 0))", ["search:projection:catalog"]);
    } finally {
      lockClient.release();
    }
  }
}

async function handleRequest(request, url) {
  if (request.method === "GET" && url.pathname === "/v1/search") return searchMedia(url);
  if (request.method === "POST" && url.pathname === "/internal/v1/documents") return upsertDocuments(request);
  if (request.method === "POST" && url.pathname === "/internal/v1/reindex") return rebuildIndex(request);
  return null;
}

startHttpService({
  name: "search",
  version: "0.2.0",
  port,
  capabilities: ["health", "service-info", "full-text-search", "trigram-fallback", "private-index-upsert"],
  readyCheck: async () => {
    if (!pool) throw new Error("Search database not configured");
    await pool.query("SELECT 1 FROM search_document LIMIT 1");
    return { database: "ok", backend: "postgresql-fts-trigram" };
  },
  handleRequest,
});
