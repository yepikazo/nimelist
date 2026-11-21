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
const contentStatuses = new Set(["MISSING", "DRAFT", "REVIEWED", "PUBLISHED", "REJECTED"]);
const curatedColumnNames = new Set(["slug", "title_id", "synopsis_id", "format", "status", "season", "season_year", "episodes", "duration_minutes", "score_avg", "popularity", "cover_url", "banner_url", "synonyms", "genres", "studios", "is_adult", "content_status", "platform_links"]);
const languages = new Set(["SUB", "DUB", "SUB_DUB", "RAW", "UNKNOWN"]);
const accessTypes = new Set(["FREE", "SUBSCRIPTION", "RENTAL", "PURCHASE", "SEARCH", "UNKNOWN"]);
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

  for (const field of ["titleEnglish", "titleNative", "titleId", "synopsisId", "sourceUrl", "season", "format", "status", "slug", "contentStatus", "coverUrl", "bannerUrl"]) {
    if (body[field] != null && typeof body[field] !== "string") {
      fail(400, "INVALID_FIELD", `${field} harus berupa string atau null.`);
    }
  }
  if ([body.titleEnglish, body.titleNative, body.titleId].some((value) => value?.length > 300)) {
    fail(400, "INVALID_TITLE", "Judul maksimal 300 karakter.");
  }
  if (body.slug != null && (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.slug) || body.slug.length > 160)) fail(400, "INVALID_SLUG", "slug hanya boleh berisi huruf kecil, angka, dan tanda hubung.");
  if (body.synopsisId != null && (typeof body.synopsisId !== "string" || body.synopsisId.length > 12000)) fail(400, "INVALID_SYNOPSIS", "synopsisId maksimal 12000 karakter atau null.");
  if (body.contentStatus != null && !contentStatuses.has(body.contentStatus)) fail(400, "INVALID_CONTENT_STATUS", "contentStatus tidak valid.");
  for (const field of ["coverUrl", "bannerUrl"]) {
    if (body[field] != null) {
      try { const url = new URL(body[field]); if (!["http:", "https:"].includes(url.protocol)) throw new Error(); }
      catch { fail(400, "INVALID_IMAGE_URL", `${field} harus URL HTTP atau HTTPS.`); }
    }
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
  if (body.synonyms != null && (!Array.isArray(body.synonyms) || body.synonyms.some((value) => typeof value !== "string" || value.length > 300))) fail(400, "INVALID_SYNONYMS", "synonyms harus berupa array string maksimal 300 karakter.");
  if (body.durationMinutes != null && (!Number.isInteger(body.durationMinutes) || body.durationMinutes < 0 || body.durationMinutes > 32767)) fail(400, "INVALID_DURATION", "durationMinutes harus bilangan bulat non-negatif.");
  if (body.scoreAvg != null && (typeof body.scoreAvg !== "number" || body.scoreAvg < 0 || body.scoreAvg > 10)) fail(400, "INVALID_SCORE", "scoreAvg harus bernilai 0 sampai 10.");
  if (body.popularity != null && (!Number.isInteger(body.popularity) || body.popularity < 0 || body.popularity > 2147483647)) fail(400, "INVALID_POPULARITY", "popularity harus bilangan bulat non-negatif.");
  if (body.curatedFields != null && (!Array.isArray(body.curatedFields) || body.curatedFields.some((field) => !curatedColumnNames.has(field)))) fail(400, "INVALID_CURATED_FIELDS", "curatedFields berisi kolom yang tidak diizinkan.");
  if (body.platformLinks != null && (!Array.isArray(body.platformLinks) || body.platformLinks.length > 30)) fail(400, "INVALID_PLATFORM_LINKS", "platformLinks harus berupa array maksimal 30 item.");
  for (const link of body.platformLinks ?? []) {
    if (!link || typeof link !== "object" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(link.platformSlug ?? "")) fail(400, "INVALID_PLATFORM_LINK", "platformSlug tautan tidak valid.");
    if (typeof link.url !== "string" || !link.url.startsWith("https://")) fail(400, "INVALID_PLATFORM_LINK", "Tautan platform harus URL HTTPS.");
    if (link.language != null && !languages.has(link.language)) fail(400, "INVALID_PLATFORM_LINK", "language tautan tidak valid.");
    if (link.accessType != null && !accessTypes.has(link.accessType)) fail(400, "INVALID_PLATFORM_LINK", "accessType tautan tidak valid.");
    if (link.status != null && link.status !== "SEARCH_ONLY") fail(400, "INVALID_PLATFORM_LINK", "Import seed hanya boleh membuat tautan SEARCH_ONLY.");
    if (link.notes != null && (typeof link.notes !== "string" || link.notes.length > 1000)) fail(400, "INVALID_PLATFORM_LINK", "notes tautan maksimal 1000 karakter.");
  }

  return {
    provider: body.provider,
    externalId: body.externalId.trim(),
    sourceUrl: body.sourceUrl ?? null,
    titleRomaji: body.titleRomaji.trim(),
    titleEnglish: body.titleEnglish?.trim() || null,
    titleNative: body.titleNative?.trim() || null,
    titleId: body.titleId?.trim() || null,
    synopsisId: body.synopsisId ?? null,
    slug: body.slug ?? null,
    format: body.format ?? null,
    status: body.status ?? null,
    season: body.season ?? null,
    seasonYear: body.seasonYear ?? null,
    episodes: body.episodes ?? null,
    genres: body.genres ?? null,
    studios: body.studios ?? null,
    isAdult: body.isAdult ?? null,
    durationMinutes: body.durationMinutes ?? null,
    scoreAvg: body.scoreAvg ?? null,
    popularity: body.popularity ?? null,
    coverUrl: body.coverUrl ?? null,
    bannerUrl: body.bannerUrl ?? null,
    synonyms: body.synonyms ?? null,
    contentStatus: body.contentStatus ?? null,
    curatedFields: body.curatedFields ?? [],
    platformLinks: body.platformLinks?.map((link) => ({
      platformSlug: link.platformSlug,
      url: link.url,
      language: link.language ?? "UNKNOWN",
      accessType: link.accessType ?? "SEARCH",
      status: "SEARCH_ONLY",
      notes: link.notes ?? null,
    })) ?? null,
  };
}

function slugPattern(value) { return typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value); }

async function importTaxonomy(request) {
  requireServiceToken(request);
  const body = await readJsonBody(request);
  if (!body || typeof body !== "object" || Array.isArray(body)) fail(400, "INVALID_BODY", "Body harus berupa object JSON.");
  const { genres = [], studios = [], platforms = [] } = body;
  if (![genres, studios, platforms].every(Array.isArray) || genres.length > 100 || studios.length > 2000 || platforms.length > 100) {
    fail(400, "INVALID_TAXONOMY", "Jumlah taxonomy melebihi batas atau bentuk data tidak valid.");
  }
  for (const [entries, kind] of [[genres, "genre"], [studios, "studio"], [platforms, "platform"]]) {
    for (const entry of entries) {
      if (!entry || typeof entry !== "object" || !slugPattern(entry.slug) || typeof entry.name !== "string" || !entry.name.trim() || entry.name.length > 200) {
        fail(400, "INVALID_TAXONOMY", `Data ${kind} harus memiliki slug dan name yang valid.`);
      }
      for (const field of ["nameId", "description", "websiteUrl", "searchUrlTemplate", "color"]) {
        if (entry[field] != null && typeof entry[field] !== "string") fail(400, "INVALID_TAXONOMY", `${field} harus berupa string.`);
      }
      if (entry.websiteUrl != null && !entry.websiteUrl.startsWith("https://")) fail(400, "INVALID_TAXONOMY", "websiteUrl harus HTTPS.");
      if (kind === "platform" && (typeof entry.websiteUrl !== "string" || !entry.websiteUrl.startsWith("https://"))) fail(400, "INVALID_TAXONOMY", "Platform harus memiliki websiteUrl HTTPS.");
      if (entry.searchUrlTemplate != null && (!entry.searchUrlTemplate.startsWith("https://") || !entry.searchUrlTemplate.includes("{q}"))) fail(400, "INVALID_TAXONOMY", "searchUrlTemplate harus URL HTTPS yang memuat {q}.");
      if (entry.sortOrder != null && (!Number.isInteger(entry.sortOrder) || entry.sortOrder < 0 || entry.sortOrder > 32767)) fail(400, "INVALID_TAXONOMY", "sortOrder harus bilangan bulat non-negatif.");
    }
  }
  const key = validIdempotencyKey(request);
  const hash = createHash("sha256").update(JSON.stringify({ genres, studios, platforms })).digest("hex");
  return inTransaction(requireDatabase(), async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [`catalog:idempotency:${key}`]);
    const prior = await client.query("SELECT request_hash, response_body FROM idempotency_keys WHERE key = $1", [key]);
    if (prior.rowCount) {
      if (prior.rows[0].request_hash !== hash) fail(409, "IDEMPOTENCY_KEY_REUSED", "Idempotency-Key sudah dipakai dengan body berbeda.");
      return { status: 200, body: prior.rows[0].response_body };
    }
    for (const genre of genres) {
      await client.query(`INSERT INTO catalog_genre (slug, name, name_id, description_id) VALUES ($1,$2,$3,$4)
        ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, name_id=EXCLUDED.name_id, description_id=EXCLUDED.description_id`,
      [genre.slug, genre.name, genre.nameId ?? null, genre.description ?? null]);
    }
    for (const studio of studios) {
      await client.query(`INSERT INTO catalog_studio (slug, name, name_native, website_url) VALUES ($1,$2,$3,$4)
        ON CONFLICT (slug) DO UPDATE SET name=EXCLUDED.name, name_native=EXCLUDED.name_native, website_url=EXCLUDED.website_url`,
      [studio.slug, studio.name, studio.nameNative ?? null, studio.websiteUrl ?? null]);
    }
    for (const platform of platforms) {
      await client.query(`INSERT INTO catalog_platform (slug, name, website_url, search_url_template, color, description, sort_order, legal_status)
        VALUES ($1,$2,$3,$4,$5,$6,$7,'UNVERIFIED') ON CONFLICT (slug) DO UPDATE SET
        name=EXCLUDED.name, website_url=EXCLUDED.website_url, search_url_template=EXCLUDED.search_url_template,
        color=EXCLUDED.color, description=EXCLUDED.description, sort_order=EXCLUDED.sort_order, updated_at=now()`,
      [platform.slug, platform.name, platform.websiteUrl, platform.searchUrlTemplate ?? null,
        platform.color ?? null, platform.description ?? null, platform.sortOrder ?? 0]);
    }
    const result = { genreCount: genres.length, studioCount: studios.length, platformCount: platforms.length };
    const event = { eventId: randomUUID(), eventType: "catalog.taxonomy.changed", eventVersion: 1,
      occurredAt: new Date().toISOString(), changedCounts: result };
    await client.query("INSERT INTO catalog_outbox (event_type, event_version, payload) VALUES ('catalog.taxonomy.changed', 1, $1::jsonb)", [JSON.stringify(event)]);
    await client.query("INSERT INTO idempotency_keys (key, request_hash, response_body) VALUES ($1,$2,$3::jsonb)", [key, hash, JSON.stringify(result)]);
    return { status: 200, body: result };
  });
}

async function syncMediaRelations(client, mediaId, body, curatedFields = []) {
  const changedFields = [];
  for (const [property, table, column] of [["genres", "media_genre", "genre_slug"], ["studios", "media_studio", "studio_slug"]]) {
    if (body[property] == null || curatedFields.includes(property)) continue;
    const currentResult = await client.query(`SELECT ${column} AS slug FROM ${table} WHERE media_id = $1 ORDER BY ${column}`, [mediaId]);
    const current = currentResult.rows.map((row) => row.slug).sort();
    const incoming = [...new Set(body[property])].sort();
    if (JSON.stringify(current) === JSON.stringify(incoming)) continue;
    const available = await client.query(`SELECT slug FROM ${property === "genres" ? "catalog_genre" : "catalog_studio"} WHERE slug = ANY($1::text[])`, [incoming]);
    if (available.rowCount !== incoming.length) fail(422, "UNKNOWN_TAXONOMY", `Ada ${property} yang belum diimpor ke Catalog.`);
    await client.query(`DELETE FROM ${table} WHERE media_id = $1`, [mediaId]);
    if (incoming.length) await client.query(`INSERT INTO ${table} (media_id, ${column}) SELECT $1, unnest($2::text[])`, [mediaId, incoming]);
    changedFields.push(property);
  }
  if (body.platformLinks != null && !curatedFields.includes("platform_links")) {
    const currentResult = await client.query(`SELECT platform_slug AS "platformSlug", url, language, access_type AS "accessType", status, notes
      FROM media_platform_link WHERE media_id = $1 ORDER BY platform_slug`, [mediaId]);
    const normalize = (links) => links.map((link) => ({
      platformSlug: link.platformSlug ?? link.platformslug,
      url: link.url,
      language: link.language,
      accessType: link.accessType ?? link.accesstype,
      status: link.status,
      notes: link.notes ?? null,
    })).sort((a, b) => a.platformSlug.localeCompare(b.platformSlug));
    const incoming = normalize(body.platformLinks);
    const current = normalize(currentResult.rows);
    if (JSON.stringify(current) !== JSON.stringify(incoming)) {
      const slugs = [...new Set(incoming.map((link) => link.platformSlug))];
      const available = await client.query("SELECT slug FROM catalog_platform WHERE slug = ANY($1::text[])", [slugs]);
      if (available.rowCount !== slugs.length) fail(422, "UNKNOWN_PLATFORM", "Ada platform yang belum diimpor ke Catalog.");
      await client.query("DELETE FROM media_platform_link WHERE media_id = $1", [mediaId]);
      for (const link of incoming) {
        await client.query(`INSERT INTO media_platform_link (media_id, platform_slug, url, language, access_type, status, notes)
          VALUES ($1,$2,$3,$4,$5,'SEARCH_ONLY',$6)
          ON CONFLICT (media_id, platform_slug, region_code, language) DO UPDATE SET
            url=EXCLUDED.url, access_type=EXCLUDED.access_type, status=EXCLUDED.status, notes=EXCLUDED.notes, updated_at=now()`,
        [mediaId, link.platformSlug, link.url, link.language, link.accessType, link.notes]);
      }
      changedFields.push("platform_links");
    }
  }
  return changedFields;
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
      const baseSlug = body.slug ?? (slugify(body.titleRomaji) || `anime-${slugify(`${body.provider}-${body.externalId}`)}`);
      const collision = await client.query("SELECT 1 FROM media WHERE slug = $1", [baseSlug]);
      if (collision.rowCount && body.slug) fail(409, "SLUG_CONFLICT", "Slug seed sudah dipakai oleh media lain.");
      const slug = collision.rowCount ? `${baseSlug}-${slugify(`${body.provider}-${body.externalId}`).slice(0, 35)}` : baseSlug;
      const created = await client.query(
        `INSERT INTO media (
          slug, title_romaji, title_english, title_native, title_id, synopsis_id, format, status, season,
          season_year, episodes, duration_minutes, score_avg, popularity, cover_url, banner_url,
          synonyms, genres, studios, is_adult, content_status, curated_fields, source, source_url, provenance
        ) VALUES (
          $1, $2, $3, $4, $5, $6, COALESCE($7, 'UNKNOWN'), COALESCE($8, 'UNKNOWN'), $9,
          $10, $11, $12, $13, COALESCE($14, 0), $15, $16, COALESCE($17::text[], '{}'::text[]),
          COALESCE($18::text[], '{}'::text[]), COALESCE($19::text[], '{}'::text[]), COALESCE($20, false), COALESCE($21, 'MISSING'),
          $22, $23, $24, jsonb_build_object($23::text, jsonb_build_object('externalId', $25::text, 'sourceUrl', $24::text))
        ) RETURNING id`,
        [slug, body.titleRomaji, body.titleEnglish, body.titleNative, body.titleId, body.synopsisId,
          body.format, body.status, body.season, body.seasonYear, body.episodes, body.durationMinutes,
          body.scoreAvg, body.popularity, body.coverUrl, body.bannerUrl, body.synonyms, body.genres,
          body.studios, body.isAdult, body.contentStatus, body.curatedFields, body.provider,
          body.sourceUrl, body.externalId],
      );
      mediaId = created.rows[0].id;
      status = "created";
      changedFields = ["slug", "title_romaji", "title_english", "title_native", "title_id", "synopsis_id", "format", "status", "season", "season_year", "episodes", "duration_minutes", "score_avg", "popularity", "cover_url", "banner_url", "synonyms", "genres", "studios", "is_adult", "content_status"];
      await client.query(
        "INSERT INTO external_id (provider, external_id, media_id, source_url) VALUES ($1, $2, $3, $4)",
        [body.provider, body.externalId, mediaId, body.sourceUrl],
      );
    } else {
      const existing = existingResult.rows[0];
      mediaId = existing.id;
      const fieldMap = [
        ["slug", "slug"], ["title_id", "titleId"], ["synopsis_id", "synopsisId"],
        ["title_romaji", "titleRomaji"], ["title_english", "titleEnglish"],
        ["title_native", "titleNative"], ["format", "format"], ["status", "status"],
        ["season", "season"], ["season_year", "seasonYear"], ["episodes", "episodes"],
        ["duration_minutes", "durationMinutes"], ["score_avg", "scoreAvg"], ["popularity", "popularity"],
        ["cover_url", "coverUrl"], ["banner_url", "bannerUrl"], ["synonyms", "synonyms"],
        ["genres", "genres"], ["studios", "studios"], ["is_adult", "isAdult"], ["content_status", "contentStatus"],
      ];
      const updates = [];
      const values = [mediaId];
      if (body.slug && body.slug !== existing.slug && !existing.curated_fields.includes("slug")) {
        const slugCollision = await client.query("SELECT 1 FROM media WHERE slug = $1 AND id <> $2", [body.slug, mediaId]);
        if (slugCollision.rowCount) fail(409, "SLUG_CONFLICT", "Slug seed sudah dipakai oleh media lain.");
      }
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
      if (body.curatedFields.length) {
        await client.query(
          "UPDATE media SET curated_fields = ARRAY(SELECT DISTINCT unnest(curated_fields || $2::text[])) WHERE id = $1",
          [mediaId, body.curatedFields],
        );
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

    changedFields.push(...await syncMediaRelations(
      client,
      mediaId,
      body,
      existingResult.rowCount ? existingResult.rows[0].curated_fields : [],
    ));
    changedFields = [...new Set(changedFields)];

    const result = { mediaId: String(mediaId), status };
    if (changedFields.length && status === "unchanged") status = "updated";
    result.status = status;
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
  const links = await requireDatabase().query(
    `SELECT l.platform_slug AS "platformSlug", p.name AS "platformName", l.url,
            l.region_code AS "regionCode", l.language, l.access_type AS "accessType", l.status, l.notes
     FROM media_platform_link l JOIN catalog_platform p ON p.slug = l.platform_slug
     WHERE l.media_id = $1 ORDER BY p.sort_order, p.name`, [row.id],
  );
  return {
    status: 200,
    body: {
      ...mediaSummary(row),
      synopsisId: ["REVIEWED", "PUBLISHED"].includes(row.content_status) ? row.synopsis_id : null,
      genres: row.genres,
      studios: row.studios,
      platformLinks: links.rows,
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

async function getInternalSearchDocuments(request, url) {
  requireServiceToken(request);
  const limit = integerParam(url.searchParams.get("limit"), 200, 1, 200);
  const offset = integerParam(url.searchParams.get("offset"), 0, 0, 1_000_000);
  const result = await requireDatabase().query(`
    SELECT m.id AS "mediaId", m.slug, m.title_romaji AS "titleRomaji", m.title_english AS "titleEnglish",
      m.title_native AS "titleNative", m.title_id AS "titleId", m.synonyms,
      COALESCE((SELECT array_agg(DISTINCT value) FROM (
        SELECT g.name AS value FROM media_genre mg JOIN catalog_genre g ON g.slug = mg.genre_slug WHERE mg.media_id=m.id
        UNION SELECT g.name_id FROM media_genre mg JOIN catalog_genre g ON g.slug=mg.genre_slug WHERE mg.media_id=m.id AND g.name_id IS NOT NULL
      ) names), '{}'::text[]) AS genres,
      COALESCE((SELECT array_agg(DISTINCT value) FROM (
        SELECT s.name AS value FROM media_studio ms JOIN catalog_studio s ON s.slug=ms.studio_slug WHERE ms.media_id=m.id
        UNION SELECT s.name_native FROM media_studio ms JOIN catalog_studio s ON s.slug=ms.studio_slug WHERE ms.media_id=m.id AND s.name_native IS NOT NULL
      ) names), '{}'::text[]) AS studios,
      COALESCE((SELECT array_agg(DISTINCT l.platform_slug) FROM media_platform_link l WHERE l.media_id=m.id), '{}'::text[]) AS platforms,
      m.format, m.status, m.season, m.season_year AS "seasonYear", m.score_avg AS "scoreAvg",
      m.popularity, m.cover_url AS "coverUrl", m.is_adult AS "isAdult"
    FROM media m ORDER BY m.id LIMIT $1 OFFSET $2`, [limit, offset]);
  return { status: 200, body: { items: result.rows, nextOffset: result.rowCount === limit ? offset + result.rowCount : null } };
}

async function handleRequest(request, url) {
  if (request.method === "GET" && url.pathname === "/v1/media") return listMedia(url);
  if (request.method === "GET" && url.pathname === "/internal/v1/search-documents") return getInternalSearchDocuments(request, url);
  if (request.method === "GET" && url.pathname === "/internal/v1/media") return getInternalMedia(request, url);
  if (request.method === "POST" && url.pathname === "/internal/v1/media/import") return importMedia(request);
  if (request.method === "POST" && url.pathname === "/internal/v1/taxonomy/import") return importTaxonomy(request);

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
  capabilities: ["health", "service-info", "catalog-read", "internal-import", "taxonomy", "platform-search-links"],
  readyCheck: async () => {
    await requireDatabase().query("SELECT 1");
    return { database: "ok" };
  },
  handleRequest,
});
