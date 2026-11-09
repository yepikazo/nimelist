# 05 — Data Sync Design

## 1. Principles

1. **Visitors never call an external API.** The web app reads Postgres only.
2. **The worker is the only process that talks to providers.** It has egress; the web app does not need it.
3. **Legal gate before technical integration.** A provider is disabled unless its terms allow our use. AniList stays off until written permission.
4. **Manual curation is a first-class provider.** It is not a fallback hack; it is the launch strategy.
5. **Idempotent, resumable, observable.** Every job can run twice without duplicating data, and every run leaves a `sync_log` row.
6. **Never overwrite curated content.** Field-level provenance and `curated_fields` protect Indonesian titles, synopses, slugs, and streaming links.

---

## 2. Provider status matrix

| Provider | Use | Status | Legal notes |
|---|---|---|---|
| **anime-offline-database** | Initial catalog seed | **Allowed with conditions** | ODbL-1.0 + DbCL; attribution, share-alike, keep notices; archived 4 Jul 2026, so no updates |
| **Manual curation** | Schedule, streaming, Indonesian text | **Allowed** | Internal editorial work; cite sources |
| **AniList** | Schedule, metadata, characters, ratings | **BLOCKED pending written permission** | ToS prohibits data storage, hoarding, and competing trackers; commercial under $150/mo free, above needs licence |
| **Kitsu** | Fallback metadata | **BLOCKED pending API terms** | Terms prohibit commercial use of Kitsu content separate from Kitsu services; API use subject to separate terms on request |
| **MyAnimeList** | User-authorised import/sync only | **Later** | Official API; no scraping; user OAuth; not a catalog seed |
| **TMDB** | Optional streaming availability | **Evaluate later** | Verify commercial terms and watch-provider attribution before use |

### AniList permission request (Phase 0)

Send before any ingestion. Keep a copy of the sent email and the response in the legal file.

**To:** contact@anilist.co
**Subject:** API permission request — Nimelist (Indonesian anime information site)

Include:

- Who we are: Nimelist, an Indonesian-language anime information site, currently pre-launch.
- What we want: permission to use the AniList GraphQL API for catalog metadata and airing schedules, stored in our own database so visitors can read fast pages.
- Why it is complementary: deep AniList OAuth integration, “Login with AniList”, two-way list sync, clear “Data by AniList” attribution, and links back to AniList entries.
- What we will **not** do: no mass hoarding beyond our catalog needs, no redistribution of raw API data, no competing tracker without the requested authorisation, no adult content promotion.
- Volume: estimated requests/day, concurrency, and caching strategy.
- Commercial model: no ads at launch; affiliate links later; revenue projection. If above $150/month, ask for the commercial licence path.
- Data retention and deletion: what we store, how users can delete, how we purge if permission is withdrawn.
- Kill switch: we can disable the provider and purge AniList-sourced fields within 24 hours.
- Contact and technical details.

**Do not** start ingestion while waiting. Build the provider behind a feature flag and test with a tiny, manually supplied fixture if needed.

---

## 3. Provider abstraction

```ts
// packages/providers/src/types.ts
import { z } from "zod";

export type ProviderName = "anilist" | "kitsu" | "offline-db" | "manual";

export interface Provider {
  name: ProviderName;
  enabled(): boolean;
  fetchSeason(input: { season: Season; year: number }): Promise<NormalizedMedia[]>;
  fetchMedia(externalId: string): Promise<NormalizedMedia | null>;
  fetchSchedule(input: { from: Date; to: Date }): Promise<NormalizedAiring[]>;
  fetchStreaming?(mediaId: string): Promise<NormalizedStreaming[]>;
}
```

Every provider returns a **normalized DTO**, validated with Zod before it touches the database. Provider-specific GraphQL/JSON shapes never leak into the app.

```ts
export const NormalizedMedia = z.object({
  provider: z.enum(["anilist", "kitsu", "offline-db", "manual"]),
  externalId: z.string(),
  url: z.string().url().optional(),
  titleRomaji: z.string().min(1),
  titleEnglish: z.string().nullable(),
  titleNative: z.string().nullable(),
  synonyms: z.array(z.string()).default([]),
  format: z.enum(["TV", "TV_SHORT", "MOVIE", "SPECIAL", "OVA", "ONA", "MUSIC", "UNKNOWN"]),
  status: z.enum(["FINISHED", "RELEASING", "NOT_YET_RELEASED", "CANCELLED", "HIATUS", "UNKNOWN"]),
  season: z.enum(["WINTER", "SPRING", "SUMMER", "FALL", "UNDEFINED"]).nullable(),
  seasonYear: z.number().int().min(1900).max(2100).nullable(),
  episodes: z.number().int().min(0).nullable(),
  durationMinutes: z.number().int().positive().nullable(),
  startDate: z.string().date().nullable(),
  endDate: z.string().date().nullable(),
  coverUrl: z.string().url().nullable(),
  bannerUrl: z.string().url().nullable(),
  isAdult: z.boolean().default(false),
  genres: z.array(z.string()).default([]),
  studios: z.array(z.string()).default([]),
  score: z.number().min(0).max(10).nullable(),
  popularity: z.number().int().min(0).default(0),
});
```

### Field precedence

| Field | Precedence |
|---|---|
| `slug` | Manual/curated only; never provider |
| `title_id`, `synopsis_id` | Manual/curated; never provider |
| `title_romaji`, `title_english`, `title_native` | Manual > AniList (if allowed) > Kitsu > ODbL |
| `cover_url`, `banner_url` | Manual > AniList (if allowed) > ODbL |
| `episodes`, `status`, `season`, `season_year` | Manual > AniList > Kitsu > ODbL |
| `score_avg` | Nimelist users only when ratings exist; otherwise provider score as a separate `external_rating` field |
| `popularity` | Local ranking; provider popularity stored separately |
| `streaming_link` | Manual only; never provider-generated at launch |
| `airing_schedule` | Manual confirmed > official platform > AniList (if allowed) > estimated |

If an incoming value conflicts with a curated field, log a `field_conflict` event and skip the write.

---

## 4. Job schedule

### 4.1 Launch jobs (laptop, no AniList)

| Job | Cron (Asia/Jakarta) | Queue | Concurrency | Source | Output | Revalidation |
|---|---|---|---|---|---|---|
| `seed:offline` | Manual once | `maintenance` | 1 | ODbL file | media, genres, studios, external IDs | All |
| `schedule:materialize` | Weekly, Mon 02:00 | `sync` | 1 | `media.broadcast_*` | next 4 weeks of `airing_schedule` | `schedule` |
| `curation:reminders` | Daily 06:00 | `maintenance` | 1 | DB | admin task list: missing synopsis/schedule/streaming | None |
| `streaming:staleness` | Daily 07:00 | `maintenance` | 1 | DB | mark links `STALE` after 30 days | `platform:*`, `media:*` |
| `outbox:dispatch` | Every 30 s | `events` | 1 | `outbox` | revalidate/index calls | N/A |
| `backup:db` | Daily 03:00 | `maintenance` | 1 | Postgres | encrypted `pg_dump` to R2 | None |
| `cleanup:retention` | Daily 04:00 | `maintenance` | 1 | DB | delete expired sessions/logs | None |
| `reindex:search` | Manual/weekly | `maintenance` | 1 | DB | rebuild `search_text` | None |
| `health:heartbeat` | Every 5 min | `events` | 1 | Worker | push heartbeat to uptime monitor | None |

### 4.2 Provider jobs (enabled only after permission)

| Job | Cron | Queue | Concurrency | Source | Notes |
|---|---|---|---|---|---|
| `sync:airing` | Hourly at :05 | `sync` | 1 | AniList/Kitsu | Next 48 h + current season; 20 req/min cap |
| `sync:recent` | Every 6 h | `sync` | 1 | AniList/Kitsu | Current season + ongoing + recently ended; provider limitations apply |
| `sync:season` | Daily 01:00 | `sync` | 1 | AniList/Kitsu | Current + next season; full detail |
| `sync:full` | Weekly, gradual | `backfill` | 1 | AniList/Kitsu | Chunked by ID range; 7-day budget |
| `sync:ratings` | Daily 05:00 | `sync` | 1 | AniList (if allowed) | Store external ratings separately |
| `sync:streaming` | Daily 08:00 | `sync` | 1 | Manual/TMDB later | Only if a licensed source exists |

**Why “recent updates” is fuzzy:** AniList does not expose a reliable “updated since” filter on all media. Define the job as “current season + ongoing + recently ended + top N popular”, not “all rows changed in the last 24 h”. For Kitsu, use its filters if documented; otherwise the same targeted refresh. Document the approximation in the admin UI.

---

## 5. Rate limiting and backoff

### 5.1 Limits

| Provider | Limit | Our budget | Implementation |
|---|---|---|---|
| AniList | 90/min normal; **30/min degraded**; burst limiter; no raises currently | **20/min**, concurrency 1, burst 5 | Redis token bucket + `X-RateLimit-*` headers |
| Kitsu | No published hard limit; polite ~10 req/s | **5 req/s**, concurrency 2 | Redis token bucket |
| ODbL | Local file | N/A | Stream from disk |
| Manual | N/A | N/A | Admin UI |

### 5.2 Behaviour

- **Token bucket per provider** in Redis (`rl:{provider}:tokens`, `rl:{provider}:ts`). Lua script for atomic take.
- **Read headers** `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`, `X-RateLimit-Reset`; adjust the local budget downward if the provider is degraded.
- **Exponential backoff with jitter**: 1 s, 2 s, 4 s, 8 s, 16 s, max 5 attempts. Respect `Retry-After` exactly if longer.
- **Circuit breaker**: open after 5 consecutive failures or 3 × 429s; half-open after 5 minutes. While open, jobs fail fast and alert.
- **Per-provider queue**: one failed provider must not block backups or revalidation.
- **Idempotency**: every job can be retried; upserts key on `external_id(provider, external_id)` and `airing_schedule(media_id, episode_number)`.
- **Dead-letter queue**: after max attempts, move to `{queue}:dead` and create an admin alert.
- **No parallel full refresh**: `sync:full` uses a dedicated `backfill` queue with concurrency 1, so it cannot starve hourly jobs.

### 5.3 AniList GraphQL specifics (after permission)

- One query per page of 50 media, request only the fields needed.
- Use `Page(page, perPage)`; stop when `hasNextPage` is false.
- Query by season for season jobs; by IDs for detail refresh.
- Do not request user data unless the user has authorised OAuth.
- Handle `429` with `Retry-After`; handle `403` as “API unavailable” and pause the provider.
- Persist the raw response hash for change detection, not the raw payload (avoid storing a mirror).
- Log request count and remaining quota per run.

---

## 6. Idempotent upserts

### 6.1 Upsert algorithm

```text
for each normalized item:
  begin transaction
    find media by external_id(provider, external_id)
    if not found:
      insert media with generated slug
      insert external_id
    else:
      compare fields; skip curated_fields
      update only changed fields
      set last_synced_at
    upsert genres, studios, external IDs
    insert sync event into outbox if public fields changed
  commit
```

### 6.2 Conflict rules

| Situation | Action |
|---|---|
| Incoming value equals current | No write; no revalidation |
| Incoming value differs, field not curated | Update; record provenance; enqueue revalidation |
| Incoming value differs, field curated | Skip; log `field_conflict` |
| Incoming row missing from provider | Mark `last_seen_at`; do not delete immediately |
| Missing for 30 days | Set `deleted_at`; 410 page; keep for redirects |
| Duplicate external IDs | Merge manually; never auto-delete a media with user list entries |
| Slug collision | Append `-2`/`-3`; never overwrite |

### 6.3 Change detection

- Compute a SHA-256 hash of the normalized public fields per media.
- Store `content_hash` in `media` (or compare `updated_at` + field values).
- Only enqueue `REVALIDATE`/`INDEX` when the hash changes.
- This prevents hourly jobs from invalidating the whole cache.

---

## 7. Schedule materialisation

Because the launch does not use AniList, the schedule is built from curated recurring slots plus manual overrides.

### 7.1 Inputs

- `media.broadcast_weekday` (1–7 ISO), `media.broadcast_time_jst` (time), `media.episodes`, `media.start_date`.
- Curator’s confirmed exceptions: delayed episode, double episode, break week, platform delay.

### 7.2 Algorithm

```text
for each airing media with broadcast_weekday/time and start_date:
  first_episode_date = next occurrence of weekday on/after start_date
  for n in 0..(episodes-1):
    airing_at_jst = first_episode_date + n weeks at broadcast_time_jst
    airing_at_utc = convert JST -> UTC
    upsert airing_schedule(media_id, episode_number=n+1)
      unless a manual row exists
    set confidence = ESTIMATED
```

- The curator can mark a row `CONFIRMED`, `DELAYED`, or `CANCELLED`.
- A manual row always wins over generated rows.
- On a schedule change, revalidate `schedule:{date}` and `media:{id}`.
- Do not generate more than 52 episodes or more than 12 months ahead.

### 7.3 WIB and DST

- Japan does not observe DST; Indonesia does not either. Conversion is a fixed offset (JST = UTC+9, WIB = UTC+7), but use `Intl`/Temporal with named zones to avoid assumptions.
- Store UTC; compute WIB date/time in the app.
- Display “WIB” explicitly. Offer WITA (UTC+8) and WIT (UTC+9) via a client toggle.

---

## 8. On-demand revalidation

### 8.1 Outbox pattern

The worker writes `outbox` rows in the same transaction as the data change:

| Event | Payload |
|---|---|
| `REVALIDATE` | `{ "tags": ["media:123", "season:fall-2026"] }` |
| `INDEX` | `{ "mediaIds": [123, 124] }` |
| `DELETE_INDEX` | `{ "mediaIds": [125] }` |

The `outbox:dispatch` job:

1. Claims a batch with `FOR UPDATE SKIP LOCKED`.
2. Coalesces tags for 30 seconds.
3. Calls `POST /api/internal/revalidate` with HMAC.
4. Marks `DONE` or retries with backoff.
5. Moves permanently failed events to a dead-letter table and alerts.

### 8.2 Internal endpoint

```ts
// app/api/internal/revalidate/route.ts
export async function POST(req: Request) {
  verifyHmac(req); // X-Internal-Token, timestamp, body
  const { tags } = schema.parse(await req.json());
  for (const tag of tags) revalidateTag(tag, "max");
  return Response.json({ ok: true });
}
```

- Reject requests from non-private IPs.
- HMAC includes timestamp; reject > 5 minutes old.
- Rate limit aggressively; this is an internal endpoint.
- `revalidateTag` uses stale-while-revalidate, so pages stay fast.

### 8.3 Tag conventions

| Tag | Invalidated by |
|---|---|
| `home` | Featured/popular changes |
| `catalog` | Media publish/unpublish |
| `media:{id}` | Media, genre, studio, streaming, schedule changes |
| `season:{season}-{year}` | Season membership/score changes |
| `schedule` | Any schedule change |
| `schedule:{yyyy-mm-dd}` | Schedule change for a date |
| `genre:{slug}` | Media-genre change |
| `studio:{slug}` | Media-studio change |
| `platform:{slug}` | Streaming link change |
| `review:{id}` | Review publish/edit/remove |
| `sitemap` | Any indexable content change |

---

## 9. Search indexing

### 9.1 Launch (Postgres)

- `media.search_text` is rebuilt by the app when titles, synonyms, genres, or studios change.
- `media.search_vector` is a generated column; no external job needed.
- A weekly `reindex:search` rebuilds all rows in batches to catch drift.
- `search_synonym` is loaded into the query builder.

### 9.2 Later (Meilisearch)

- Outbox `INDEX` events enqueue `search:index` jobs.
- Batch 500 documents; `addDocuments` is idempotent by primary key.
- Deletes use `deleteDocuments`.
- Full reindex weekly into a new index, then swap (`media_v2` → `media`) for zero-downtime settings changes.
- See `06-search.md`.

---

## 10. Logging, alerting, and admin

### 10.1 Every job writes

- `sync_log`: provider, job name, run ID, status, counts, error summary, duration.
- Structured JSON logs: `job`, `runId`, `provider`, `batch`, `durationMs`, `errorCode`.
- Sentry breadcrumb + exception on failure.
- A heartbeat to the external uptime monitor after success.

### 10.2 Alerts

| Condition | Channel | Severity |
|---|---|---|
| Job failed twice in a row | Discord/Telegram + email | High |
| No successful `sync:airing` in 3 h (when enabled) | Discord | High |
| No successful backup in 26 h | Discord + email | Critical |
| AniList 403/429 circuit open | Discord | High |
| Outbox backlog > 1,000 or oldest > 15 min | Discord | Medium |
| Disk < 1.5 GB free | Discord | Critical |
| Memory > 90% for 10 min | Discord | High |
| Provider disabled by feature flag | Admin dashboard | Info |

### 10.3 Admin dashboard

- Last run per job, status, duration, counts.
- Next scheduled run.
- Provider flags and circuit state.
- Outbox backlog and dead-letter count.
- Curation queue: missing synopsis, missing streaming, stale links, unconfirmed schedules.
- One-click retry (safe, idempotent).
- Audit log of manual edits.

---

## 11. Failure modes and recovery

| Failure | Impact | Recovery |
|---|---|---|
| AniList API down | No new provider data | Keep serving DB; circuit opens; alert; manual curation continues |
| AniList permission denied | No AniList data at all | Stay on ODbL + manual; do not purge existing data unless required |
| Redis down | Queue stops; app reads still work | Restart; jobs are idempotent; re-enqueue |
| Postgres down | Site errors | Restore from backup; app returns 503 |
| Meilisearch down (later) | Search degraded | Fallback to Postgres FTS |
| Worker down | No sync/revalidation | Pages serve stale cache; alert; restart |
| Revalidation endpoint down | Pages stale until TTL | Outbox retries; cache TTL is the safety net |
| Disk full | Postgres/worker crash | Prune logs/images; alert at 1.5 GB |
| Bad migration | Site/data risk | Restore backup; roll back image; fix migration |
| Duplicate media | Split lists/reviews | Merge tool; redirect old slug; never delete user data |

---

## 12. Legal kill switch

- Feature flags: `PROVIDER_ANILIST_ENABLED`, `PROVIDER_KITSU_ENABLED`, `PROVIDER_OFFLINE_DB_ENABLED`.
- A single admin action disables a provider and stops all jobs.
- A purge job can null out provider-sourced fields while keeping manually curated content.
- Document the purge in `audit_log`.
- If AniList withdraws permission, purge AniList-sourced fields within 24 hours and notify users via the changelog.
