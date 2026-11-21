# 12 — AniList Integration Change Plan

**Updated:** 21 November 2026  
**Status:** Proposal only. AniList API calls, ingestion, and OAuth are not enabled. Written clarification is the first gate.

## Goal

Evaluate an AniList integration that complements Nimelist without turning AniList into a data source that Nimelist mirrors or stores without authorization. Keep the ODbL seed and manual curation path operational regardless of the decision.

## Decision gate

Current AniList API terms prohibit using the API as a backup or data storage service, mass collection/hoarding, and use in competing non-complementary anime/manga list or tracker services. The terms say they are lenient about mass collection for purely educational work; this does **not** establish an exception to the other restrictions. Nimelist's public anime catalog and schedule make the competition question an unresolved interpretation. Do not infer that attribution, OAuth, or the educational context grants permission.

Before any live integration, send AniList a precise description of the coursework/product and ask whether each proposed use is permitted. Specifically ask about:

- Public catalog and schedule lookup from a separately operated Indonesian anime information site.
- Displaying API fields to users and linking back to AniList.
- Any in-memory/short-lived cache, saved AniList IDs, provenance, or persistent media fields.
- User-authorized AniList list viewing/import, including data retained in Nimelist user records.
- Any write-back to a user's AniList list.
- Attribution, adult-content filtering, commercial thresholds, retention, and deletion requirements.

**Gate rule:** if the response is absent, ambiguous, or does not cover the exact feature and storage behavior, keep that feature disabled. A general permission to make API requests must not be treated as permission to build a persistent catalog mirror.

## Candidate feature paths

| Path | User value | Data behavior | Decision before AniList reply |
|---|---|---|---|
| Link out to an AniList media page | Simple way to continue on AniList | No API call or AniList data stored | Can be considered independently; verify ordinary link/brand presentation |
| User-triggered public media lookup | Enrich a specific page/search | Live API response; no Catalog import, persistent cache, or raw response logging unless expressly allowed | Hold pending written clarification because Nimelist is a catalog site |
| Connect a user's AniList account | Show that user's own list alongside Nimelist info | OAuth and user-specific API access; no global media backfill | Later phase only; requires product and policy approval |
| Import or sync a user's list into Nimelist | Avoid re-entering a user's personal status/progress | Persists user-list data in Nimelist | High policy sensitivity; request explicit approval for each read/write/retention behavior |
| Bulk catalog or airing sync | Keep Nimelist's database fresh from AniList | Mass retrieval and persistent storage | Do not implement under the current plan |

The recommended first step is the permission request, not bulk data ingestion. If permission is not granted, Nimelist continues with anime-offline-database under its license and manual updates.

## Change sequence

### Phase 0 — Clarify product use and request guidance

- [ ] Keep `PROVIDER_ANILIST_ENABLED=false`; do not send production requests or route AniList payloads to Catalog's persistent import API.
- [ ] Decide whether the desired feature is a link-out, a public lookup, or user-account integration. Do not bundle all three into one vague request.
- [ ] Email `contact@anilist.co` with a short architecture description and the exact data fields, request pattern, cache/storage behavior, user flow, and coursework/commercial context.
- [ ] Save AniList's response and record the approved feature, fields, rate, retention, attribution, and conditions here or in the legal record.
- [ ] If AniList declines or does not clarify, record the decision and proceed with the existing ODbL/manual provider path.

Suggested request outline:

```text
Subject: Clarification request for AniList API use in Nimelist coursework

Nimelist is an Indonesian anime information and airing-schedule project. It is
not currently a personal list/tracker service. We are evaluating [one exact
feature]. The integration would [describe every field requested], use
[request frequency], and [state whether any response, ID mapping, or user data
would be retained]. The project is [coursework/non-commercial/commercial and
revenue context].

Could you confirm whether this exact use is permitted under the current API
terms, whether Nimelist is considered a competing service, and what limits,
attribution, caching, retention, deletion, and commercial conditions apply?
We will leave the integration disabled until we understand the answer.
```

### Phase 1 — Record an approved, narrow use case

- [ ] Translate the written response into a feature-specific allowlist. Do not treat approval for public lookups as approval for bulk sync or OAuth list writes.
- [ ] Define exactly which AniList fields may be requested and displayed. Keep Nimelist's Indonesian synopsis original and its manually curated fields protected.
- [ ] Define whether even external ID mappings and short-lived caches are permitted. If unclear, do not persist them.
- [ ] Confirm commercial status and whether projected revenue crosses AniList's currently documented $150/month threshold.
- [ ] Review adult-content behavior before any result is exposed; AniList warns that adult classification may be incomplete.

### Phase 2 — Implement the approved adapter only

If approved, implement one provider adapter in `services/ingestion` on Server 3. It is the only service with provider egress. Use AniList's GraphQL endpoint (`POST https://graphql.anilist.co`) with variables and request only fields covered by the approval.

- [ ] Use the existing `PROVIDER_ANILIST_ENABLED` flag and default it off in every environment.
- [ ] Keep provider response types inside the adapter and map only approved fields into a small normalized DTO.
- [ ] Do not call Catalog's `/internal/v1/media/import` for AniList data unless written terms explicitly permit that persistent use.
- [ ] Keep schedule ownership in Schedule Service; do not replace manually verified schedule slots without approval and source/confidence rules.
- [ ] Do not persist raw provider responses, response hashes, media records, or ID mappings unless each retention type was approved.
- [ ] If only request-time lookup is approved, use a bounded pass-through and avoid disk/database caches. Add a cache only if its retention is explicitly allowed.
- [ ] Add attribution and a link to the AniList record in the approved display surface.

### Phase 3 — Rate limits, resilience, and observability

AniList's rate-limit page currently warns that the API is degraded to 30 requests/minute; its normal published limit is 90/minute. Use the lower limit until the official warning changes.

- [ ] Start with a global budget of at most 20 requests/minute, concurrency 1, and no burst jobs.
- [ ] Read `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`, and `X-RateLimit-Reset`; respect `Retry-After` and reduce the local budget when advised.
- [ ] Treat HTTP 429 as throttling and pause the provider; treat AniList's temporary-unavailability 403 as a circuit-breaker event, not a retry storm.
- [ ] Keep provider request counts, status codes, and backoff state in operational logs; do not log tokens, personal data, GraphQL variables containing private user data, or full responses.
- [ ] Preserve the current Catalog/Schedule response if AniList is unavailable; show a graceful fallback and keep manual curation available.

### Phase 4 — Optional user-account connection

This phase is separate from public media lookup and should wait until Nimelist has its own account model and explicit policy approval. Public media queries do not require authentication. Private user data and list mutations do.

- [ ] Decide whether the user feature is read-only, import, or two-way sync; request permission for that exact behavior.
- [ ] If approved, use the server-side Authorization Code Grant and an exact registered redirect URI.
- [ ] Treat the token as highly sensitive: AniList documents that scopes are unsupported, tokens grant broad access, last one year, and have no refresh-token flow.
- [ ] Store a token only with explicit user consent and encrypted-at-rest storage; never send it to browser logs, analytics, or unrelated services.
- [ ] Show a preview and conflict policy before any user-list data is copied or written back. Provide disconnect and deletion behavior.
- [ ] Avoid two-way sync in the first release; start with the smallest approved read-only flow if permission covers it.

## Three-server placement after approval

```text
Server 1: Next.js/BFF
  └── calls private Ingestion API for an approved lookup; never calls AniList directly

Server 2: Catalog, Schedule, Search, PostgreSQL
  └── serves Nimelist-owned data; no AniList egress

Server 3: Ingestion + provider adapter
  └── controlled AniList egress, feature flag, global rate limiter, circuit breaker
```

If the approved use is user-specific, the user token must reach only the approved server-side adapter over the private network. Do not put the client secret or access token in a public browser bundle.

## Acceptance checklist

- [ ] Written permission/clarification is attached to the precise use case, or the provider remains disabled.
- [ ] A test fixture proves DTO mapping without requiring live API calls.
- [ ] The adapter cannot run while `PROVIDER_ANILIST_ENABLED` is false.
- [ ] Automated request throttling stays within the approved rate and reacts to 429/403 correctly.
- [ ] No unapproved AniList data reaches Catalog/Schedule persistence or logs.
- [ ] User-facing attribution, adult-content handling, and fallback behavior match the approved scope.
- [ ] A kill switch stops calls immediately; any required purge process is documented and rehearsed.

## References checked 21 November 2026

- [AniList API Terms of Use](https://docs.anilist.co/guide/terms-of-use)
- [AniList rate limits](https://docs.anilist.co/guide/rate-limiting)
- [AniList API considerations and availability](https://docs.anilist.co/guide/considerations)
- [GraphQL request format](https://docs.anilist.co/guide/graphql/)
- [Authentication overview](https://docs.anilist.co/guide/auth/)
- [Authorization Code Grant](https://docs.anilist.co/guide/auth/authorization-code)
