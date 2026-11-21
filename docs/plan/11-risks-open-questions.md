# 11 — Risks, Open Questions, and Decision Log

## 1. Risk register

Scoring: **L** = likelihood (1 low – 5 high), **I** = impact (1 low – 5 high), **Score** = L×I.

| # | Risk | L | I | Score | Mitigation | Owner | Trigger |
|---|---|---|---|---|---|---|---|
| R1 | AniList denies or ignores permission | 4 | 5 | 20 | Launch on ODbL + manual; keep provider abstract; evaluate licensed provider; do not ingest until approved | Founder | No response by Week 2 |
| R2 | AniList permission granted but with conditions we cannot meet | 2 | 4 | 8 | Clarify scope in writing; legal review; kill switch; purge if needed | Founder | Response received |
| R3 | ODbL share-alike conflicts with proprietary DB plans | 3 | 4 | 12 | Isolate derived catalog DB; publish ODbL notice; legal review; keep user data separate | Founder/Legal | Before seed |
| R4 | Poster/banner copyright claim | 4 | 4 | 16 | Hotlink + attribution + takedown; seek permission; placeholder fallback; no rehosting | Founder | First takedown |
| R5 | Synopsis translation is derivative infringement | 3 | 5 | 15 | Original Indonesian summaries; no machine translation of provider text; contributor licence | Editor | Before publish |
| R6 | Kitsu terms block commercial use | 3 | 3 | 9 | Do not use as primary; request API terms; user import only if allowed | Founder | Before integration |
| R7 | Three-server topology has a single instance per critical service | 4 | 4 | 16 | Backups, health checks, documented restore, staged rollout; define acceptable downtime for assignment deployment | DevOps | Public traffic / outage |
| R8 | Manual curation does not scale | 4 | 4 | 16 | Curate only Tier A; recurring schedule generation; admin tooling; 3 h/week budget | Curator | > 6 h/week |
| R9 | Schedule/streaming data is wrong | 4 | 4 | 16 | Source URLs, last-verified, confidence labels, report link, weekly audit | Curator | User reports |
| R10 | SEO competition from pirate sites | 4 | 3 | 12 | Target legal/info intent; unique Indonesian content; schedule freshness; E-E-A-T | Growth | Flat organic traffic |
| R11 | Next 16 / Prisma 7 / Better Auth incompatibility | 3 | 4 | 12 | Pin versions; Phase 0 spikes; fallback to Auth.js beta or Drizzle if blocked | Dev | Spike fails |
| R12 | Postgres FTS relevance is poor | 3 | 3 | 9 | Golden queries; synonyms; trigram; move to Meilisearch when justified | Dev | Top-3 < 90% |
| R13 | AdSense rejection or low revenue | 4 | 3 | 12 | Do not depend on ads; affiliate first; premium later; keep CWV | Founder | Application rejected |
| R14 | UGC legal liability (UU ITE/PSE) | 3 | 5 | 15 | Defer UGC until PSE + moderation; guidelines; takedown SLA; counsel | Legal/Mod | Before reviews |
| R15 | Data breach / account takeover | 3 | 5 | 15 | 2FA admin, rate limits, least privilege, encryption, incident runbook | Dev | Security alert |
| R16 | Backup fails or restore untested | 3 | 5 | 15 | Daily R2 backup, checksum, monthly restore test, alert if > 26 h | DevOps | Restore test fails |
| R17 | Scope creep / burnout | 5 | 4 | 20 | Narrow MVP; explicit non-goals; weekly gate; cut list | Lead | Behind by > 1 week |
| R18 | Email deliverability (OTP) | 3 | 3 | 9 | SPF/DKIM/DMARC; reputable provider; monitor bounce/complaint | Dev | OTP in spam |
| R19 | Cloudflare/Tunnel dependency | 3 | 3 | 9 | Document DNS/tunnel; fallback VPS with direct Caddy; status page | DevOps | Tunnel down |
| R20 | Provider rate limit degradation | 4 | 3 | 12 | 20/min budget; queue; circuit breaker; manual fallback | Dev | 429 spike |
| R21 | Duplicate media / bad merges | 4 | 3 | 12 | External ID matching; confidence; manual merge; slug history | Curator | Duplicate report |
| R22 | Payment/refund complexity (premium) | 3 | 3 | 9 | Postpone; use Midtrans/Xendit; clear policy; entitlements server-side | Product | Phase 4 |
| R23 | Domain/brand trademark conflict | 2 | 4 | 8 | Search before launch; counsel; avoid similar names | Founder | Before domain purchase |
| R24 | Search index or cache poisoning | 2 | 4 | 8 | Server-side validation; no client-trusted data; reindex; audit | Dev | Anomaly |
| R25 | Analytics/privacy non-compliance | 3 | 4 | 12 | Consent, minimisation, privacy policy, DPAs | Legal | Before analytics |
| R26 | Jikan public API unavailable | 5 | 4 | 20 | Do not call `api.jikan.moe`; use ODbL seed/manual curation and evaluate approved providers or self-hosting separately | Tech lead | Provider integration |
| R27 | Microservice network or contract failure breaks page rendering | 3 | 4 | 12 | Timeouts, versioned contracts, stale/cache fallback, request IDs, contract checks in CI | Tech lead | API rollout |
| R28 | Service data ownership erodes into shared-table coupling | 3 | 4 | 12 | Separate DBs/schemas, roles, migrations; prohibit cross-service DB access | Tech lead | Schema review |

### Top 5 to watch weekly

1. R7 — service availability and recovery on the three-server setup.
2. R26 — replacement data provider after Jikan public API shutdown.
3. R17 — scope/burnout.
4. R4/R5 — image and synopsis copyright.
5. R9 — schedule/streaming accuracy.

---

## 2. Open questions

Answer these before or during Phase 0. Defaults are in brackets.

| # | Question | Why it matters | Default if unanswered | Owner | Deadline |
|---|---|---|---|---|---|
| Q1 | Has AniList replied? What is the timeline? | Determines provider roadmap | Assume no; ODbL + manual | Founder | Week 2 |
| Q2 | What are the CPU, RAM, disk, and network specs for each of the three servers? | Capacity planning for service placement | Use estimates in `08-architecture-infra.md`, then measure | Founder/DevOps | Before deployment |
| Q3 | Are the servers connected by a private network or VPN, and which host can expose 80/443? | Internal API and database security | Only Server 1 public; WireGuard/Tailscale/VPC for private traffic | DevOps | Before deployment |
| Q4 | What is the domain and brand name? | SEO, email, OAuth redirects | `nimelist.id` placeholder | Founder | Week 1 |
| Q5 | Who is the Indonesian editor/curator, and how many hours/week? | Content quality and schedule accuracy | 3 h/week, part-time | Founder | Week 1 |
| Q6 | Which legal platforms are priority for curation? | Streaming coverage | Bstation, Crunchyroll, Netflix, iQIYI, Vidio | Curator | Week 2 |
| Q7 | Are we willing to publish the derived catalog DB under ODbL? | Share-alike compliance | Yes, with attribution page | Founder/Legal | Week 1 |
| Q8 | What is the image policy: hotlink, licensed, or placeholder? | Copyright risk and page quality | Hotlink + attribution + takedown | Founder/Legal | Week 1 |
| Q9 | Minimum age: 13+ with safeguards or 17+ for UGC? | Privacy/child safety | 13+ read-only; 17+ for UGC | Legal | Week 2 |
| Q10 | Who owns PSE registration and legal pages? | Legal launch gate | Founder + counsel | Founder | Week 3 |
| Q11 | Do we have Google/Discord OAuth apps and an email sender? | Phase 2 auth | Create in Phase 0 | Dev | Week 4 |
| Q12 | Ads/affiliate accounts: which networks/programs? | Monetization | Affiliate only after launch | Founder | Phase 4 |
| Q13 | Premium price/payment provider? | Phase 4 | Rp 15k/month, Midtrans | Product | Phase 4 |
| Q14 | Which approved provider, if any, will enrich the ODbL seed? | Catalog freshness and legal use | ODbL + manual curation; no Jikan public API | Founder | Before ingestion |
| Q15 | Do we need English UI in year one? | Routing/content workload | No; Indonesian only | Product | Phase 4 |
| Q16 | Who is on-call for incidents? | Ops readiness | Founder + dev | Founder | Launch |
| Q17 | What is the exact public launch date? | Roadmap | End of Week 6 | Lead | Week 1 |
| Q18 | Are reviews/comments in scope before PSE registration? | Legal risk | No; defer UGC | Legal | Week 1 |

---

## 3. Decision log

| Date | Decision | Rationale | Status |
|---|---|---|---|
| 21 Nov 2026 | Ask AniList to clarify the exact feature and retention; no API calls until clear | Terms prohibit storage/hoarding and competing non-complementary trackers; Nimelist's fit is unresolved | Accepted |
| 9 Nov 2026 | Launch on ODbL seed + manual curation | AniList may not respond in time; manual data is a differentiator | Accepted |
| 9 Nov 2026 | 4–6 week schedule MVP, no accounts at public launch | Team capacity and focus | Accepted |
| 9 Nov 2026 | 2–3 person team | Realistic capacity | Accepted |
| 9 Nov 2026 | Laptop 2 GB / 10 GB for beta; VPS gate for public launch | Free budget now, reliability later | Accepted with risk |
| 9 Nov 2026 | Indonesian only | SEO and content focus | Accepted |
| 9 Nov 2026 | AI draft + human edit for synopses | Quality, cost, legal | Accepted |
| 9 Nov 2026 | No ads until traffic | Protect CWV/SEO | Accepted |
| 9 Nov 2026 | Better Auth over Auth.js v5 beta | Stable, Next 16 support | Accepted |
| 9 Nov 2026 | Prisma 7.10.1 pinned | Mature; latest is 8 RC | Accepted |
| 9 Nov 2026 | Postgres FTS for MVP, Meilisearch later | Fits 2 GB laptop | Accepted |
| 9 Nov 2026 | npm workspaces, no Turborepo | Small team, shared code | Accepted |
| 9 Nov 2026 | Modular monolith + worker | Avoid microservices overhead | Accepted |
| 21 Nov 2026 | Three-server microservices target: Web/BFF, Catalog, Schedule, Search, Ingestion | Required by assignment; services own data and communicate through versioned APIs/events | Accepted as target; implementation pending |
| 21 Nov 2026 | Jikan public API is not a dependency | Official public endpoint discontinued 1 Oct 2026 | Accepted |

---

## 4. Triggers that change the plan

| If this happens | Then |
|---|---|
| AniList confirms in writing that a specific proposed feature is permitted | Implement only that feature and its approved data handling; do not infer approval for bulk sync, storage, or OAuth writes |
| AniList denies permission | Stay on ODbL + manual; remove any AniList data; evaluate licensed provider |
| Server specifications or private network differ from planning assumptions | Reassign service containers, resize hosts, and verify private-only reachability before deployment |
| Search complaints or measured relevance/latency issue | Add Meilisearch behind Search Service API |
| Jikan self-hosting is chosen | Isolate Jikan's MongoDB/Typesense/Redis and indexer capacity; document data rights and maintenance; keep Nimelist APIs independent |
| Curation > 6 h/week | Reduce scope to current season + top 200; hire/volunteer curator |
| UGC about to launch | Complete PSE registration, moderation, guidelines, Turnstile, audit log |
| Core Web Vitals fail | Remove ads/client JS; optimize LCP image; reduce third parties |
| Security incident | Follow incident runbook; notify within statutory deadlines if required |
| ODbL share-alike is unacceptable | Switch to a licensed provider or rebuild catalog from permitted facts; legal review |
| Better Auth/Next 16 incompatibility | Spike Auth.js beta or a minimal session library; do not block catalog launch |
| Prisma 7 issues | Evaluate Drizzle; migrations are SQL-first, so the schema ports |

---

## 5. Glossary

| Term | Meaning |
|---|---|
| **ODbL** | Open Database License; allows commercial use with attribution/share-alike for derivative databases |
| **DbCL** | Database Contents License; covers contents of an ODbL database where applicable |
| **PSE** | Penyelenggara Sistem Elektronik; Indonesian electronic system operator registration |
| **UU PDP** | Law 27/2022 on Personal Data Protection |
| **UU ITE** | Electronic Information and Transactions Law (as amended) |
| **WIB/WITA/WIT** | Western/Central/Eastern Indonesia Time (UTC+7/+8/+9) |
| **ISR** | Incremental Static Regeneration; in Next 16, expressed with Cache Components + `use cache` |
| **PPR** | Partial Prerendering; static shell + streamed dynamic holes |
| **MoSCoW** | Must/Should/Could/Won't prioritisation |
| **RPO/RTO** | Recovery Point/Time Objective |
| **CWV** | Core Web Vitals (LCP, INP, CLS) |
| **CSP** | Content Security Policy |
| **HMAC** | Hash-based message authentication for the internal revalidate endpoint |
| **Kill switch** | Feature flag that disables a provider and stops its jobs |

---

## 6. Final recommendation

**Start with the service contracts and data-source review, then build one vertical slice through the new boundaries.**

The assignment requires independently deployable services, so agree on ownership and API/event contracts before splitting the existing SQLite repository. In parallel, keep the seed/manual path available and review provider terms. Jikan's public endpoint has been discontinued; no implementation should depend on it.

### First task checklist (this week)

- [ ] Confirm CPU/RAM/disk and private-network access for each of the three servers.
- [ ] Define Catalog, Schedule, Search, and Ingestion OpenAPI/event contracts and service data ownership.
- [ ] Book a 1-hour legal review of ODbL attribution/share-alike and image use.
- [ ] Confirm domain, editor hours, and approved provider direction; AniList stays disabled until its intended use is authorized.
- [ ] Create independently buildable workspaces and one container per initial service.
- [ ] Import a small ODbL fixture through Ingestion → Catalog API and add one manually curated schedule through Schedule API.
- [ ] Update Next.js to render that catalog/detail/schedule slice through internal API clients.

That gives the team a reviewable end-to-end slice — provider/curation → owned service data → internal API → Next.js page — while provider approval remains independent.
