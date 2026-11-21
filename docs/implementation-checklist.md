# Nimelist — Implementation Checklist

**Updated:** 21 November 2026  
**Status:** Server 2 local stack, core Catalog/Schedule/Search APIs, Catalog-to-Search relay, and Next.js core-route integration are implemented; end-to-end verification and three-server deployment remain pending.

This checklist separates completed design work from runnable scaffolding and production work. A health endpoint means a process starts; it does not mean that the service's business functions are implemented.

## Fokus MVP aktif

Prioritasnya alur inti Nimelist dan persyaratan microservices:

1. Next.js menampilkan katalog, detail anime, jadwal WIB, dan hasil pencarian melalui API Catalog, Schedule, dan Search.
2. Seed/manual curation menjadi sumber data awal; perubahan Catalog masuk ke Search melalui outbox yang sudah berjalan.
3. Deploy tiga kelompok layanan sesuai penempatan Server 1, Server 2, dan Server 3.

**Pekerjaan berikutnya:** jalankan verifikasi end-to-end untuk alur inti dan selesaikan deployment tiga server. Implementasi Ingestion dibatasi ke alur seed/manual yang diperlukan MVP.

Fitur berikut ditunda dan tidak memblokir MVP: integrasi AniList/provider eksternal, akun/watchlist/review, Meilisearch, synonym dan tuning relevansi Search, serta broker umum untuk event selain alur Catalog→Search yang sudah aktif.

## Completed: product and architecture decisions

- [x] Reviewed the existing Nimelist docs and beta implementation.
- [x] Recorded the three-host placement: public web, private APIs/data, integrations/operations.
- [x] Defined initial service ownership: Catalog, Schedule, Search, Ingestion; Next.js is the web/BFF.
- [x] Defined private service APIs, event communication, and separate data ownership.
- [x] Confirmed that the public Jikan API was discontinued; it is not a production dependency. [Official notice](https://github.com/jikan-me/jikan-rest/issues/613)
- [x] Updated the design, data, search, security, sync, risk, and roadmap documents.
- [x] Updated README architecture notes while preserving the existing seed/script edits.
- [x] Added a gated AniList integration plan; current AniList terms and product-fit questions are documented before any API use.

## Completed: implementation foundation

- [x] Added npm workspaces for `services/*` and `packages/*`.
- [x] Added the shared HTTP runtime with `/healthz` and `/v1/info`.
- [x] Added independent Node service packages for Catalog, Schedule, Search, and Ingestion.
- [x] Added one Dockerfile per service.
- [x] Added a resource-capped local Server 2 Compose profile sized for this laptop, with loopback-only host ports.
- [x] Added isolated PostgreSQL databases/roles for Catalog, Schedule, and Search plus persistent Redis for future queue work.
- [x] Added OpenAPI 3.1 contracts for the four services.
- [x] Added versioned JSON Schema contracts for Catalog and Schedule change events.
- [x] Added root scripts to start each service individually.
- [x] Added Catalog and Schedule PostgreSQL migrations, connection pools, and migration commands.
- [x] Added a Search-owned PostgreSQL FTS/trigram projection, migration, readiness check, query API, and internal upsert/rebuild routes.
- [x] Added normalized Catalog genre, studio, platform, media relation, and platform-link tables.
- [x] Implemented public Catalog list/detail APIs and authenticated, idempotent internal import.
- [x] Implemented authenticated batch Catalog summaries for service-to-service enrichment.
- [x] Implemented Schedule date API (`Asia/Jakarta`) and authenticated, idempotent slot upsert.
- [x] Added service readiness checks against the owned PostgreSQL database.
- [x] Added transactional outbox records for Catalog and Schedule changes.
- [x] Added `catalog.taxonomy.changed` event contract and persisted taxonomy updates in the Catalog outbox.
- [x] Updated Catalog/Schedule API contracts and Dockerfiles to include PostgreSQL dependencies and migrations.
- [x] Added a dry-run-first media seed importer that uses the Catalog API, preserves seed slugs, and retries transient failures.
- [x] Extended the seed importer to upsert taxonomy and preserve platform search links as `SEARCH_ONLY`.

## Current implementation limits

- [ ] Provision production PostgreSQL and configure separate Catalog, Schedule, and Search database credentials.
- [x] Start the local Server 2 containers, apply Catalog/Schedule migrations, and import all 91 media seed records (plus taxonomy and search-only platform links).
- [x] Configure a local shared `INTERNAL_API_TOKEN` for Catalog/Search internal calls.
- [x] Apply local Search migration, rebuild 91 documents from Catalog API, and verify exact-title plus typo queries.
- [x] Deliver all 91 pending media events and one taxonomy event to Search; verify zero pending outbox rows and 91 versioned documents.
- [ ] Configure production secrets and verify deployed service APIs against production database connections.
- [ ] Add contract validation/generation in CI.
- [x] Build and launch the local Server 2 images; PostgreSQL, Redis, Catalog, Schedule, and Search report healthy.

## Phase 1 — Core service APIs

### Server and data ownership

- [ ] Confirm CPU, RAM, disk, OS, and private-network connectivity for all three servers.
- [ ] Decide whether PostgreSQL databases will be separate databases or schemas per owner; assign separate roles and migration owners.
- [ ] Provision production PostgreSQL on the private data host; add a general-purpose message broker only if new consumers require it.
- [x] Add initial migrations for Catalog and Schedule-owned data.
- [ ] Add migrations for Ingestion-owned data when its persistence model is implemented.
- [ ] Define backup, restore, and secret-management procedures before production data is loaded.

### Catalog Service

- [x] Implement `GET /v1/media` and `GET /v1/media/{slug}` against Catalog-owned data.
- [x] Implement authenticated, idempotent `POST /internal/v1/media/import`.
- [x] Preserve source provenance, curated-field overrides, adult filtering, and synopsis review gating in API responses.
- [x] Run the media seed importer against local Catalog PostgreSQL and reconcile any slug conflicts.
- [x] Add normalized genre/studio/platform tables and import their seed relations; keep demo schedule rows out of Catalog.
- [x] Persist `catalog.media.changed` events in the transactional outbox.
- [x] Deliver Catalog media/taxonomy outbox events to Search with a lease, retry backoff, and completion timestamp.
- [ ] Tambahkan broker umum untuk Catalog outbox jika consumer baru memang membutuhkannya; jalur Catalog→Search saat ini sudah berjalan via relay HTTP.

### Schedule Service

- [x] Implement `GET /v1/schedule/{date}` in `Asia/Jakarta` with Catalog batch enrichment.
- [x] Implement authenticated, idempotent schedule-slot curation/upsert.
- [x] Preserve confidence, source URL, and weekly episode progression.
- [x] Add Schedule-owned persistence and transactional `schedule.changed` outbox events.
- [ ] Tambahkan publikasi schedule outbox ke broker dan precedence multi-source bila sumber jadwal otomatis mulai digunakan.

### Search Service

- [x] Implement `GET /v1/search` against a Search-owned PostgreSQL projection; Search does not query Catalog tables directly.
- [x] Start with PostgreSQL full-text search and trigram matching; keep Meilisearch optional pending capacity and relevance measurements.
- [x] Add an authenticated full projection rebuild from the internal Catalog API and an idempotent document upsert endpoint.
- [x] Consume Catalog outbox events idempotently for incremental index updates; taxonomy changes trigger a full rebuild.
- [x] Implement query length limits, cursor pagination, trigram typo fallback, and adult-content exclusion.
- [ ] **Ditunda:** synonyms, facet pencarian, dan tuning relevansi lanjutan.

### Ingestion Service

- [x] Implement the seed importer through the Catalog API; local live import is complete and idempotent.
- [ ] Expose the existing seed/manual import workflow through the Ingestion Service on Server 3.
- [ ] **Ditunda:** queue, scheduler, provider rate limiting, sync-run dan dead-letter handling untuk integrasi otomatis.
- [ ] **Ditunda:** AniList/provider adapters sampai diperlukan untuk MVP dan izin penggunaannya jelas.
- [ ] **Ditunda:** Jikan self-hosted; jangan jadikan `api.jikan.moe` dependency.

## Phase 2 — Connect the existing web app

- [x] Add a typed API client for Catalog in Next.js, including list filters, taxonomy, detail, and related media.
- [x] Add typed API clients for Schedule and Search in Next.js.
- [x] Connect the global search form and `/search` results page to Search Service through a server-only client.
- [x] Connect homepage, catalog, detail, and date-based schedule pages to Catalog/Schedule APIs.
- [ ] Verify the integrated core routes against the running three-service stack and document local service URLs.
- [ ] Replace `lib/repository.ts` SQLite reads page group by page group.
- [ ] Preserve current routes, metadata, sitemap eligibility, and `noindex` rules during migration.
- [ ] Add bounded timeouts and stale/cache fallback behavior for internal API failures.
- [ ] Remove production dependence on `node:sqlite` only after all routes use service APIs.
- [ ] Configure shared Next.js cache/tag coordination before running multiple web instances. [Next.js self-hosting guidance](https://nextjs.org/docs/app/guides/self-hosting)

## Phase 3 — Deploy and operate the three hosts

- [ ] Add Compose deployment files for Server 1, Server 2, and Server 3.
- [ ] Restrict public ingress to Server 1; keep databases, broker, and internal APIs private.
- [ ] Add CI for lint/typecheck, contract checks, per-service image builds, and deployment by immutable image tag.
- [ ] Deploy staging with separate databases, queues, credentials, and hostname protections.
- [ ] Configure external uptime checks, error reporting, log retention, and backup alerts.
- [ ] Test restore from off-host backups and document rollback/incident steps.
- [ ] Verify the user flow: home → catalog → detail → schedule → search.

## Later product work

- [ ] Authentication and user service, only when account features enter scope.
- [ ] Watchlists, ratings, reviews, moderation, and privacy/data-export workflows.
- [ ] Legal review of ODbL share-alike, posters, provider terms, and Indonesian regulatory obligations.
- [ ] Revisit resource sizes and service replicas using actual measurements.
