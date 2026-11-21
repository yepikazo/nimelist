# Nimelist — Implementation Checklist

**Updated:** 21 November 2026  
**Status:** Foundation plus first Catalog and Schedule API/database slice implemented; server provisioning and integration remain pending.

This checklist separates completed design work from runnable scaffolding and production work. A health endpoint means a process starts; it does not mean that the service's business functions are implemented.

## Completed: product and architecture decisions

- [x] Reviewed the existing Nimelist docs and beta implementation.
- [x] Recorded the three-host placement: public web, private APIs/data, integrations/operations.
- [x] Defined initial service ownership: Catalog, Schedule, Search, Ingestion; Next.js is the web/BFF.
- [x] Defined private service APIs, event communication, and separate data ownership.
- [x] Confirmed that the public Jikan API was discontinued; it is not a production dependency. [Official notice](https://github.com/jikan-me/jikan-rest/issues/613)
- [x] Updated the design, data, search, security, sync, risk, and roadmap documents.
- [x] Updated README architecture notes while preserving the existing seed/script edits.

## Completed: implementation foundation

- [x] Added npm workspaces for `services/*` and `packages/*`.
- [x] Added the shared HTTP runtime with `/healthz` and `/v1/info`.
- [x] Added independent Node service packages for Catalog, Schedule, Search, and Ingestion.
- [x] Added one Dockerfile per service.
- [x] Added OpenAPI 3.1 contracts for the four services.
- [x] Added versioned JSON Schema contracts for Catalog and Schedule change events.
- [x] Added root scripts to start each service individually.
- [x] Added Catalog and Schedule PostgreSQL migrations, connection pools, and migration commands.
- [x] Implemented public Catalog list/detail APIs and authenticated, idempotent internal import.
- [x] Implemented authenticated batch Catalog summaries for service-to-service enrichment.
- [x] Implemented Schedule date API (`Asia/Jakarta`) and authenticated, idempotent slot upsert.
- [x] Added service readiness checks against the owned PostgreSQL database.
- [x] Added transactional outbox records for Catalog and Schedule changes.
- [x] Updated Catalog/Schedule API contracts and Dockerfiles to include PostgreSQL dependencies and migrations.

## Current implementation limits

- [ ] Provision PostgreSQL and set independent `DATABASE_URL` values for Catalog and Schedule; APIs return not-ready until configured.
- [ ] Configure the same secret (`INTERNAL_API_TOKEN`, at least 32 characters) for authenticated service-to-service calls.
- [ ] Run migrations and perform database-backed API verification after connection details are available.
- [ ] Add contract validation/generation in CI.
- [ ] Build and launch service images to verify Docker build context and runtime behavior.

## Phase 1 — Core service APIs

### Server and data ownership

- [ ] Confirm CPU, RAM, disk, OS, and private-network connectivity for all three servers.
- [ ] Decide whether PostgreSQL databases will be separate databases or schemas per owner; assign separate roles and migration owners.
- [ ] Provision PostgreSQL and the message broker on the private data host.
- [x] Add initial migrations for Catalog and Schedule-owned data.
- [ ] Add migrations for Ingestion-owned data when its persistence model is implemented.
- [ ] Define backup, restore, and secret-management procedures before production data is loaded.

### Catalog Service

- [x] Implement `GET /v1/media` and `GET /v1/media/{slug}` against Catalog-owned data.
- [x] Implement authenticated, idempotent `POST /internal/v1/media/import`.
- [x] Preserve source provenance, curated-field overrides, adult filtering, and synopsis review gating in API responses.
- [ ] Import the current seed into the Catalog database and reconcile slug changes.
- [x] Persist `catalog.media.changed` events in the transactional outbox.
- [ ] Publish catalog outbox events to the broker and mark delivery status.

### Schedule Service

- [x] Implement `GET /v1/schedule/{date}` in `Asia/Jakarta` with Catalog batch enrichment.
- [x] Implement authenticated, idempotent schedule-slot curation/upsert.
- [x] Preserve confidence, source URL, and weekly episode progression.
- [x] Add Schedule-owned persistence and transactional `schedule.changed` outbox events.
- [ ] Publish schedule outbox events to the broker and define precedence among multiple schedule sources.

### Search Service

- [ ] Implement the Search API using a Search-owned projection; do not query Catalog tables directly.
- [ ] Start with PostgreSQL FTS/trigram or select Meilisearch after measuring Server 2 capacity.
- [ ] Consume catalog and schedule events idempotently; implement full reindex/rebuild.
- [ ] Implement query length limits, pagination, synonyms, facets, and adult-content policy.

### Ingestion Service

- [ ] Implement the seed importer through the Catalog API.
- [ ] Add queue, scheduler, retry/backoff, provider rate limiting, sync-run records, and dead-letter handling.
- [ ] Keep provider adapters disabled until their current terms and data-retention permissions are reviewed.
- [ ] Add one approved provider adapter only after that review; retain manual curation as an independent path.
- [ ] Do not configure `api.jikan.moe`; evaluate self-hosted Jikan separately if still desired.

## Phase 2 — Connect the existing web app

- [ ] Add typed API clients for Catalog, Schedule, and Search in Next.js.
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
