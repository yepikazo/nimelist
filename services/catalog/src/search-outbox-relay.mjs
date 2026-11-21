import { inTransaction } from "../../../packages/service-runtime/src/index.mjs";

const supportedTypes = ["catalog.media.changed", "catalog.taxonomy.changed"];
const batchSize = 10;
const leaseSeconds = 600;
let running = false;

async function claimBatch(pool) {
  return inTransaction(pool, async (client) => {
    const result = await client.query(`
      WITH pending AS (
        SELECT event_id FROM catalog_outbox
        WHERE published_at IS NULL
          AND (locked_until IS NULL OR locked_until < now())
          AND event_type = ANY($1::text[])
        ORDER BY created_at, event_id
        FOR UPDATE SKIP LOCKED
        LIMIT $2
      )
      UPDATE catalog_outbox AS outbox
      SET attempts = outbox.attempts + 1, locked_until = now() + ($3::text || ' seconds')::interval
      FROM pending
      WHERE outbox.event_id = pending.event_id
      RETURNING outbox.event_id, outbox.event_type, outbox.payload, outbox.attempts`,
    [supportedTypes, batchSize, leaseSeconds]);
    return result.rows;
  });
}

async function sendEvent(event, catalogUrl, searchUrl, token) {
  if (event.event_type === "catalog.taxonomy.changed") {
    const response = await fetch(`${searchUrl}/internal/v1/reindex`, {
      method: "POST",
      headers: { authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(120_000),
    });
    if (!response.ok) throw new Error(`Search reindex returned HTTP ${response.status}.`);
    return;
  }

  const mediaId = event.payload?.mediaId;
  if (typeof mediaId !== "string") throw new Error("Catalog media event has no mediaId.");
  const sourceResponse = await fetch(`${catalogUrl}/internal/v1/search-documents?mediaId=${encodeURIComponent(mediaId)}&limit=1`, {
    headers: { authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15_000),
  });
  const source = await sourceResponse.json().catch(() => ({}));
  if (!sourceResponse.ok) throw new Error(`Catalog search document returned HTTP ${sourceResponse.status}.`);
  if (!Array.isArray(source.items) || source.items.length !== 1) throw new Error(`Catalog media ${mediaId} is missing from the search projection source.`);

  const searchResponse = await fetch(`${searchUrl}/internal/v1/documents`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ items: source.items }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!searchResponse.ok) throw new Error(`Search document upsert returned HTTP ${searchResponse.status}.`);
}

async function deliver(event, pool, catalogUrl, searchUrl, token) {
  try {
    await sendEvent(event, catalogUrl, searchUrl, token);
    await pool.query(`UPDATE catalog_outbox
      SET published_at=now(), locked_until=NULL, last_error=NULL
      WHERE event_id=$1 AND published_at IS NULL`, [event.event_id]);
    console.log(JSON.stringify({ level: "info", service: "catalog", event: "outbox-delivered", eventId: event.event_id, eventType: event.event_type }));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const retrySeconds = Math.min(300, 2 ** Math.min(event.attempts, 9));
    await pool.query(`UPDATE catalog_outbox
      SET locked_until=now() + ($2::text || ' seconds')::interval, last_error=$3
      WHERE event_id=$1 AND published_at IS NULL`, [event.event_id, retrySeconds, message.slice(0, 1000)]);
    console.error(JSON.stringify({ level: "warn", service: "catalog", event: "outbox-retry", eventId: event.event_id, eventType: event.event_type, retrySeconds, message }));
  }
}

export function startSearchOutboxRelay(pool) {
  const catalogUrl = process.env.CATALOG_SERVICE_URL?.replace(/\/$/, "");
  const searchUrl = process.env.SEARCH_SERVICE_URL?.replace(/\/$/, "");
  const token = process.env.INTERNAL_API_TOKEN;
  if (!catalogUrl || !searchUrl || !token || token.length < 32) {
    console.info(JSON.stringify({ level: "info", service: "catalog", event: "search-outbox-relay-disabled" }));
    return;
  }

  const poll = async () => {
    if (running) return;
    running = true;
    let pollFailed = false;
    try {
      const batch = await claimBatch(pool);
      for (const event of batch) await deliver(event, pool, catalogUrl, searchUrl, token);
    } catch (error) {
      pollFailed = true;
      console.error(JSON.stringify({ level: "error", service: "catalog", event: "outbox-poll-error", message: error instanceof Error ? error.message : String(error) }));
    } finally {
      running = false;
      const timer = setTimeout(poll, pollFailed ? 10_000 : 1000);
      timer.unref();
    }
  };

  console.info(JSON.stringify({ level: "info", service: "catalog", event: "search-outbox-relay-started", batchSize }));
  void poll();
}
