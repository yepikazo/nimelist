import { createHash, randomUUID } from "node:crypto";
import {
  inTransaction,
  readJsonBody,
  requireServiceToken,
  ServiceError,
  startHttpService,
} from "../../../packages/service-runtime/src/index.mjs";
import { pool } from "./db.mjs";

const port = Number(process.env.PORT ?? 4101);
const providers = new Set(["offline-db", "manual", "mal", "anilist", "jikan-self-hosted"]);
const seasons = new Set(["WINTER", "SPRING", "SUMMER", "FALL"]);
const formats = new Set(["TV", "TV_SHORT", "MOVIE", "SPECIAL", "OVA", "ONA", "MUSIC", "UNKNOWN"]);
const statuses = new Set(["FINISHED", "RELEASING", "NOT_YET_RELEASED", "CANCELLED", "HIATUS", "UNKNOWN"]);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function fail(status, code, message) {
  throw new ServiceError(status, code, message);
}

function requireDatabase() {
  if (!pool) fail(503, "DATABASE_NOT_CONFIGURED", "DATABASE_URL Catalog belum dikonfigurasi.");
  return pool;
}

function integerParam(value, fallback, min, max) {
  if (value == null) return fallback;
  if (!/^\d+$/.test(value)) fail(400, "INVALID_PARAMETER", "Parameter angka tidak valid.");
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    fail(400, "INVALID_PARAMETER", "Parameter angka di luar batas.");
  }
  return parsed;
}

function mediaSummary(row) {
  return {
    id: String(row.id),
    slug: row.slug,
    title: row.title_id ?? row.title_romaji,
    titleRomaji: row.title_romaji,
    titleEnglish: row.title_english,
    titleId: row.title_id,
    format: row.format,
    status: row.status,
    season: row.season,
    seasonYear: row.season_year == null ? null : Number(row.season_year),
    coverUrl: row.cover_url,
  };
}

function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 150);
}

function parseMediaImport(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    fail(400, "INVALID_BODY", "Body harus berupa object JSON.");
  }
  if (!providers.has(body.provider)) fail(400, "INVALID_PROVIDER", "Provider tidak valid.");
  if (typeof body.externalId !== "string" || body.externalId.length < 1 || body.externalId.length > 100) {
    fail(400, "INVALID_EXTERNAL_ID", "externalId wajib diisi dan maksimal 100 karakter.");
  }
  if (typeof body.titleRomaji !== "string" || !body.titleRomaji.trim() || body.titleRomaji.length > 300) {
    fail(400, "INVALID_TITLE", "titleRomaji wajib diisi dan maksimal 300 karakter.");
  }

  for (const field of ["titleEnglish", "titleNative", "sourceUrl", "season", "format", "status"]) {
    if (body[field] != null && typeof body[field] !== "string") {
      fail(400, "INVALID_FIELD", `${field} harus berupa string atau null.`);
    }
  }
  if (body.titleEnglish?.length > 300 || body.titleNative?.length > 300) {
    fail(400, "INVALID_TITLE", "Judul maksimal 300 karakter.");
  }
  if (body.sourceUrl != null) {
    try {
      const url = new URL(body.sourceUrl);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error("protocol");
    } catch {
      fail(400, "INVALID_SOURCE_URL", "sourceUrl harus berupa URL HTTP atau HTTPS.");
    }
  }
  if (body.season != null && !seasons.has(body.season)) fail(400, "INVALID_SEASON", "Season tidak valid.");
  if (body.format != null && !formats.has(body.format)) fail(400, "INVALID_FORMAT", "Format tidak valid.");
  if (body.status != null && !statuses.has(body.status)) fail(400, "INVALID_STATUS", "Status media tidak valid.");
  if (body.seasonYear != null && (!Number.isInteger(body.seasonYear) || body.seasonYear < 1900 || body.seasonYear > 2100)) {
    fail(400, "INVALID_SEASON_YEAR", "seasonYear harus di antara 1900 dan 2100.");
  }
  if (body.episodes != null && (!Number.isInteger(body.episodes) || body.episodes < 0 || body.episodes > 32767)) {
    fail(400, "INVALID_EPISODES", "episodes harus bilangan bulat non-negatif.");
  }
  if (body.genres != null && (!Array.isArray(body.genres) || body.genres.some((value) => typeof value !== "string" || value.length > 100))) {
    fail(400, "INVALID_GENRES", "genres harus berupa array string maksimal 100 karakter.");
  }
  if (body.studios != null && (!Array.isArray(body.studios) || body.studios.some((value) => typeof value !== "string" || value.length > 160))) {
    fail(400, "INVALID_STUDIOS", "studios harus berupa array string maksimal 160 karakter.");
  }
  if (body.isAdult != null && typeof body.isAdult !== "boolean") fail(400, "INVALID_ADULT_FLAG", "isAdult harus boolean.");

  return {
    provider: body.provider,
    externalId: body.externalId.trim(),
    sourceUrl: body.sourceUrl ?? null,
    titleRomaji: body.titleRomaji.trim(),
    titleEnglish: body.titleEnglish?.trim() || null,
    titleNative: body.titleNative?.trim() || null,
    format: body.format ?? null,
    status: body.status ?? null,
    season: body.season ?? null,
    seasonYear: body.seasonYear ?? null,
    episodes: body.episodes ?? null,
    genres: body.genres ?? null,
    studios: body.studios ?? null,
    isAdult: body.isAdult ?? null,
  };
}

function validIdempotencyKey(request) {
  const key = String(request.headers["idempotency-key"] ?? "");
  if (key.length < 8 || key.length > 200) fail(400, "INVALID_IDEMPOTENCY_KEY", "Idempotency-Key wajib 8–200 karakter.");
  return key;
}

async function importMedia(request) {
  requireServiceToken(request);
  const body = parseMediaImport(await readJsonBody(request));
  const idempotencyKey = validIdempotencyKey(request);
  const requestHash = createHash("sha256").update(JSON.stringify(body)).digest("hex");

  const responseBody = await inTransaction(requireDatabase(), async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [`catalog:idempotency:${idempotencyKey}`]);
    const prior = await client.query("SELECT request_hash, response_body FROM idempotency_keys WHERE key = $1", [idempotencyKey]);
    if (prior.rowCount) {
      if (prior.rows[0].request_hash !== requestHash) {
        fail(409, "IDEMPOTENCY_KEY_REUSED", "Idempotency-Key sudah dipakai dengan body berbeda.");
      }
      return prior.rows[0].response_body;
    }

    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [
      `catalog:external:${body.provider}:${body.externalId}`,
    ]);
    const existingResult = await client.query(
      `SELECT m.* FROM media m
       JOIN external_id x ON x.media_id = m.id
       WHERE x.provider = $1 AND x.external_id = $2 FOR UPDATE OF m`,
      [body.provider, body.externalId],
    );

    let mediaId;
    let status;
    let changedFields = [];
    if (!existingResult.rowCount) {
      const baseSlug = slugify(body.titleRomaji) || `anime-${slugify(`${body.provider}-${body.externalId}`)}`;
      const collision = await client.query("SELECT 1 FROM media WHERE slug = $1", [baseSlug]);
      const slug = collision.rowCount
        ? `${baseSlug}-${slugify(`${body.provider}-${body.externalId}`).slice(0, 35)}`
        : baseSlug;
      const created = await client.query(
        `INSERT INTO media (
          slug, title_romaji, title_english, title_native, format, status, season,
          season_year, episodes, genres, studios, is_adult, source, source_url, provenance
        ) VALUES (
          $1, $2, $3, $4, COALESCE($5, 'UNKNOWN'), COALESCE($6, 'UNKNOWN'),
          $7, $8, $9, COALESCE($10, '{}'), COALESCE($11, '{}'), COALESCE($12, false),
          $13, $14, jsonb_build_object($13, jsonb_build_object('externalId', $15, 'sourceUrl', $14))
        ) RETURNING id`,
        [slug, body.titleRomaji, body.titleEnglish, body.titleNative, body.format, body.status,
          body.season, body.seasonYear, body.episodes, body.genres, body.studios,
          body.isAdult, body.provider, body.sourceUrl, body.externalId],
      );
      mediaId = created.rows[0].id;
      status = "created";
      changedFields = ["title_romaji", "title_english", "title_native", "format", "status", "season", "season_year", "episodes", "genres", "studios", "is_adult"];
      await client.query(
        "INSERT INTO external_id (provider, external_id, media_id, source_url) VALUES ($1, $2, $3, $4)",
        [body.provider, body.externalId, mediaId, body.sourceUrl],
      );
    } else {
      const existing = existingResult.rows[0];
      mediaId = existing.id;
      const fieldMap = [
        ["title_romaji", "titleRomaji"], ["title_english", "titleEnglish"],
        ["title_native", "titleNative"], ["format", "format"], ["status", "status"],
        ["season", "season"], ["season_year", "seasonYear"], ["episodes", "episodes"],
        ["genres", "genres"], ["studios", "studios"], ["is_adult", "isAdult"],
      ];
      const updates = [];
      const values = [mediaId];
      for (const [column, property] of fieldMap) {
        const incoming = body[property];
        if (incoming == null || existing.curated_fields.includes(column)) continue;
        const current = existing[column];
        const same = Array.isArray(incoming)
          ? JSON.stringify([...incoming].sort()) === JSON.stringify([...(current ?? [])].sort())
          : String(incoming) === String(current);
        if (same) continue;
        values.push(incoming);
        updates.push(`${column} = $${values.length}`);
        changedFields.push(column);
      }
      if (updates.length) {
        updates.push("updated_at = now()");
        await client.query(`UPDATE media SET ${updates.join(", ")} WHERE id = $1`, values);
      }
      await client.query(
        `UPDATE external_id SET source_url = $3, last_seen_at = now()
         WHERE provider = $1 AND external_id = $2`,
        [body.provider, body.externalId, body.sourceUrl],
      );
      await client.query(
        `UPDATE media SET provenance = provenance || $2::jsonb, updated_at = CASE WHEN $3 THEN now() ELSE updated_at END
         WHERE id = $1`,
        [mediaId, JSON.stringify({ [body.provider]: { externalId: body.externalId, sourceUrl: body.sourceUrl } }), changedFields.length > 0],
      );
      status = changedFields.length ? "updated" : "unchanged";
    }

    const result = { mediaId: String(mediaId), status };
    if (changedFields.length) {
      await client.query(
        `INSERT INTO catalog_outbox (event_type, event_version, payload)
         VALUES ('catalog.media.changed', 1, $1::jsonb)`,
        [JSON.stringify({ eventId: randomUUID(), eventType: "catalog.media.changed", eventVersion: 1,
          occurredAt: new Date().toISOString(), mediaId: String(mediaId), changedFields })],
      );
    }
    await client.query(
      "INSERT INTO idempotency_keys (key, request_hash, response_body) VALUES ($1, $2, $3::jsonb)",
      [idempotencyKey, requestHash, JSON.stringify(result)],
    );
    return result;
  });

  return { status: 202, body: responseBody };
}

async function listMedia(url) {
  const database = requireDatabase();
  const page = integerParam(url.searchParams.get("page"), 1, 1, 100_000);
  const pageSize = integerParam(url.searchParams.get("pageSize"), 24, 1, 60);
  const conditions = ["is_adult = false"];
  const values = [];
  const addCondition = (condition, value) => {
    values.push(value);
    conditions.push(condition.replace("?", `$${values.length}`));
  };

  const query = url.searchParams.get("q")?.trim();
  if (query) {
    if (query.length > 80) fail(400, "QUERY_TOO_LONG", "q maksimal 80 karakter.");
    addCondition("(title_romaji ILIKE '%' || ? || '%' OR COALESCE(title_english, '') ILIKE '%' || ? || '%' OR COALESCE(title_id, '') ILIKE '%' || ? || '%' OR array_to_string(synonyms, ' ') ILIKE '%' || ? || '%')", query);
    // All four predicates share the same value placeholder.
    const placeholder = `$${values.length}`;
    conditions[conditions.length - 1] = `(title_romaji ILIKE '%' || ${placeholder} || '%' OR COALESCE(title_english, '') ILIKE '%' || ${placeholder} || '%' OR COALESCE(title_id, '') ILIKE '%' || ${placeholder} || '%' OR array_to_string(synonyms, ' ') ILIKE '%' || ${placeholder} || '%')`;
  }
  const genre = url.searchParams.get("genre");
  if (genre) addCondition("? = ANY(genres)", genre);
  const season = url.searchParams.get("season");
  if (season) {
    if (!seasons.has(season)) fail(400, "INVALID_SEASON", "season tidak valid.");
    addCondition("season = ?", season);
  }
  const yearValue = url.searchParams.get("year");
  if (yearValue != null) addCondition("season_year = ?", integerParam(yearValue, 0, 1900, 2100));

  const where = conditions.join(" AND ");
  const countPromise = database.query(`SELECT count(*)::int AS total FROM media WHERE ${where}`, values);
  const rowValues = [...values, pageSize, (page - 1) * pageSize];
  const rowsPromise = database.query(
    `SELECT id, slug, title_romaji, title_english, title_id, format, status,
            season, season_year, cover_url
     FROM media WHERE ${where}
     ORDER BY popularity DESC, title_romaji ASC
     LIMIT $${rowValues.length - 1} OFFSET $${rowValues.length}`,
    rowValues,
  );
  const [count, rows] = await Promise.all([countPromise, rowsPromise]);
  return {
    status: 200,
    body: {
      items: rows.rows.map(mediaSummary),
      page,
      pageSize,
      total: count.rows[0].total,
    },
  };
}

async function getMediaBySlug(slug) {
  const result = await requireDatabase().query(
    `SELECT id, slug, title_romaji, title_english, title_id, format, status,
            season, season_year, cover_url, synopsis_id, genres, studios, content_status
     FROM media WHERE slug = $1 AND is_adult = false`,
    [slug],
  );
  if (!result.rowCount) fail(404, "MEDIA_NOT_FOUND", "Anime tidak ditemukan.");
  const row = result.rows[0];
  return {
    status: 200,
    body: {
      ...mediaSummary(row),
      synopsisId: ["REVIEWED", "PUBLISHED"].includes(row.content_status) ? row.synopsis_id : null,
      genres: row.genres,
      studios: row.studios,
      contentStatus: row.content_status,
    },
  };
}

async function getInternalMedia(request, url) {
  requireServiceToken(request);
  const ids = (url.searchParams.get("ids") ?? "").split(",").filter(Boolean);
  if (ids.length < 1 || ids.length > 100 || ids.some((id) => !uuidPattern.test(id))) {
    fail(400, "INVALID_MEDIA_IDS", "ids harus berisi 1–100 UUID.");
  }
  const result = await requireDatabase().query(
    `SELECT id, slug, COALESCE(title_id, title_romaji) AS title,
            title_romaji AS "titleRomaji", title_english AS "titleEnglish", cover_url AS "coverUrl"
     FROM media WHERE id = ANY($1::uuid[]) AND is_adult = false`,
    [ids],
  );
  return { status: 200, body: { items: result.rows.map((row) => ({ ...row, id: String(row.id) })) } };
}

async function handleRequest(request, url) {
  if (request.method === "GET" && url.pathname === "/v1/media") return listMedia(url);
  if (request.method === "GET" && url.pathname === "/internal/v1/media") return getInternalMedia(request, url);
  if (request.method === "POST" && url.pathname === "/internal/v1/media/import") return importMedia(request);

  const detailMatch = url.pathname.match(/^\/v1\/media\/([^/]+)$/);
  if (request.method === "GET" && detailMatch) {
    let slug;
    try {
      slug = decodeURIComponent(detailMatch[1]);
    } catch {
      fail(400, "INVALID_SLUG", "Slug tidak valid.");
    }
    return getMediaBySlug(slug);
  }
  return null;
}

startHttpService({
  name: "catalog",
  version: "0.1.0",
  port,
  capabilities: ["health", "service-info", "catalog-read", "internal-import"],
  readyCheck: async () => {
    await requireDatabase().query("SELECT 1");
    return { database: "ok" };
  },
  handleRequest,
});
