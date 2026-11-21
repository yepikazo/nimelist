import { createHash, randomUUID } from "node:crypto";
import {
  inTransaction,
  readJsonBody,
  requireServiceToken,
  ServiceError,
  startHttpService,
} from "../../../packages/service-runtime/src/index.mjs";
import { pool } from "./db.mjs";

const port = Number(process.env.PORT ?? 4102);
const confidenceValues = new Set(["CONFIRMED", "ESTIMATED"]);
const sources = new Set(["OFFICIAL_SITE", "PLATFORM", "MANUAL", "PROVIDER"]);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function fail(status, code, message) { throw new ServiceError(status, code, message); }
function database() {
  if (!pool) fail(503, "DATABASE_NOT_CONFIGURED", "DATABASE_URL Schedule belum dikonfigurasi.");
  return pool;
}
function dateParts(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? "")) fail(400, "INVALID_DATE", "Tanggal harus berformat YYYY-MM-DD.");
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    fail(400, "INVALID_DATE", "Tanggal kalender tidak valid.");
  }
  return date;
}
function parseSlot(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) fail(400, "INVALID_BODY", "Body harus berupa object JSON.");
  if (typeof body.mediaId !== "string" || !uuidPattern.test(body.mediaId)) fail(400, "INVALID_MEDIA_ID", "mediaId harus UUID.");
  if (!Number.isInteger(body.dayOfWeek) || body.dayOfWeek < 1 || body.dayOfWeek > 7) fail(400, "INVALID_DAY", "dayOfWeek harus 1–7 (Senin–Minggu).");
  if (typeof body.timeWib !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(body.timeWib)) fail(400, "INVALID_TIME", "timeWib harus HH:mm.");
  const baseDate = dateParts(body.baseDate);
  if ((baseDate.getUTCDay() || 7) !== body.dayOfWeek) fail(400, "BASE_DATE_WEEKDAY_MISMATCH", "baseDate harus jatuh pada dayOfWeek yang dipilih.");
  if (!Number.isInteger(body.baseEpisode) || body.baseEpisode < 1) fail(400, "INVALID_EPISODE", "baseEpisode minimal 1.");
  if (body.episodes != null && (!Number.isInteger(body.episodes) || body.episodes < 1)) fail(400, "INVALID_EPISODES", "episodes harus bilangan bulat positif atau null.");
  if (!confidenceValues.has(body.confidence)) fail(400, "INVALID_CONFIDENCE", "confidence tidak valid.");
  if (!sources.has(body.source)) fail(400, "INVALID_SOURCE", "source tidak valid.");
  if (body.sourceUrl != null) {
    try { const u = new URL(body.sourceUrl); if (!["http:", "https:"].includes(u.protocol)) throw new Error(); }
    catch { fail(400, "INVALID_SOURCE_URL", "sourceUrl harus URL HTTP atau HTTPS."); }
  }
  return { ...body, sourceUrl: body.sourceUrl ?? null, episodes: body.episodes ?? null };
}
function idempotencyKey(request) {
  const key = String(request.headers["idempotency-key"] ?? "");
  if (key.length < 8 || key.length > 200) fail(400, "INVALID_IDEMPOTENCY_KEY", "Idempotency-Key wajib 8–200 karakter.");
  return key;
}

async function upsertSlot(request) {
  requireServiceToken(request);
  const slot = parseSlot(await readJsonBody(request));
  const key = idempotencyKey(request);
  const hash = createHash("sha256").update(JSON.stringify(slot)).digest("hex");
  const body = await inTransaction(database(), async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [`schedule:idempotency:${key}`]);
    const prior = await client.query("SELECT request_hash, response_body FROM idempotency_keys WHERE key = $1", [key]);
    if (prior.rowCount) {
      if (prior.rows[0].request_hash !== hash) fail(409, "IDEMPOTENCY_KEY_REUSED", "Idempotency-Key sudah dipakai dengan body berbeda.");
      return prior.rows[0].response_body;
    }
    const old = await client.query(
      "SELECT id, day_of_week, time_wib, base_date, base_episode, episodes, confidence, source, source_url FROM schedule_slot WHERE media_id = $1 AND day_of_week = $2 AND time_wib = $3 FOR UPDATE",
      [slot.mediaId, slot.dayOfWeek, slot.timeWib],
    );
    const result = await client.query(
      `INSERT INTO schedule_slot (media_id, day_of_week, time_wib, base_date, base_episode, episodes, confidence, source, source_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (media_id, day_of_week, time_wib) DO UPDATE SET
         base_date=EXCLUDED.base_date, base_episode=EXCLUDED.base_episode, episodes=EXCLUDED.episodes,
         confidence=EXCLUDED.confidence, source=EXCLUDED.source, source_url=EXCLUDED.source_url, updated_at=now()
       RETURNING id`,
      [slot.mediaId, slot.dayOfWeek, slot.timeWib, slot.baseDate, slot.baseEpisode, slot.episodes,
        slot.confidence, slot.source, slot.sourceUrl],
    );
    const unchanged = old.rowCount && Object.entries({
      day_of_week: slot.dayOfWeek, time_wib: slot.timeWib, base_date: slot.baseDate,
      base_episode: slot.baseEpisode, episodes: slot.episodes, confidence: slot.confidence,
      source: slot.source, source_url: slot.sourceUrl,
    }).every(([k, v]) => String(old.rows[0][k] ?? "") === String(v ?? ""));
    const status = unchanged ? "unchanged" : old.rowCount ? "updated" : "created";
    if (!unchanged) {
      await client.query(
        "INSERT INTO schedule_outbox (event_type, event_version, payload) VALUES ('schedule.changed', 1, $1::jsonb)",
        [JSON.stringify({ eventId: randomUUID(), eventType: "schedule.changed", eventVersion: 1,
          occurredAt: new Date().toISOString(), slotId: String(result.rows[0].id), mediaId: slot.mediaId })],
      );
    }
    const response = { slotId: String(result.rows[0].id), status };
    await client.query("INSERT INTO idempotency_keys (key, request_hash, response_body) VALUES ($1,$2,$3::jsonb)", [key, hash, JSON.stringify(response)]);
    return response;
  });
  return { status: 200, body };
}

async function catalogSummaries(ids) {
  if (!ids.length) return new Map();
  const base = process.env.CATALOG_SERVICE_URL ?? "http://127.0.0.1:4101";
  const token = process.env.INTERNAL_API_TOKEN;
  if (!token || token.length < 32) fail(503, "INTERNAL_AUTH_NOT_CONFIGURED", "Autentikasi internal belum dikonfigurasi.");
  let response;
  try {
    response = await fetch(`${base.replace(/\/$/, "")}/internal/v1/media?ids=${encodeURIComponent(ids.join(","))}`, {
      headers: { authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(3000),
    });
  } catch { fail(502, "CATALOG_UNAVAILABLE", "Catalog Service tidak dapat dihubungi."); }
  if (!response.ok) fail(502, "CATALOG_UNAVAILABLE", "Catalog Service gagal memberikan metadata.");
  const payload = await response.json();
  return new Map(payload.items.map((item) => [item.id, item]));
}

async function getSchedule(dateString) {
  const date = dateParts(dateString);
  const dayOfWeek = date.getUTCDay() || 7;
  const rows = await database().query(
    `SELECT id, media_id, day_of_week, time_wib, base_date, base_episode, episodes, confidence, source_url
     FROM schedule_slot WHERE day_of_week = $1 AND base_date <= $2
     ORDER BY time_wib ASC`, [dayOfWeek, dateString],
  );
  const slots = rows.rows.flatMap((row) => {
    const baseDate = String(row.base_date).slice(0, 10);
    const elapsedDays = Math.floor((date.getTime() - new Date(`${baseDate}T00:00:00.000Z`).getTime()) / 86400000);
    const episodeNumber = Number(row.base_episode) + Math.floor(elapsedDays / 7);
    if (row.episodes != null && episodeNumber > Number(row.episodes)) return [];
    return [{ ...row, mediaId: String(row.media_id), episodeNumber }];
  });
  const summaries = await catalogSummaries([...new Set(slots.map((slot) => slot.mediaId))]);
  return { status: 200, body: { date: dateString, timezone: "Asia/Jakarta", items: slots.flatMap((slot) => {
    const media = summaries.get(slot.mediaId);
    if (!media) return [];
    return [{ mediaId: slot.mediaId, slug: media.slug, title: media.title,
      episodeNumber: slot.episodeNumber, date: dateString,
      timeWib: String(slot.time_wib).slice(0, 5), confidence: slot.confidence, sourceUrl: slot.source_url }];
  }) } };
}

async function handleRequest(request, url) {
  const match = url.pathname.match(/^\/v1\/schedule\/(\d{4}-\d{2}-\d{2})$/);
  if (request.method === "GET" && match) return getSchedule(match[1]);
  if (request.method === "PUT" && url.pathname === "/internal/v1/slots") return upsertSlot(request);
  return null;
}

startHttpService({
  name: "schedule", version: "0.1.0", port,
  capabilities: ["health", "service-info", "schedule-read", "internal-slot-curation"],
  readyCheck: async () => { await database().query("SELECT 1"); return { database: "ok" }; },
  handleRequest,
});
