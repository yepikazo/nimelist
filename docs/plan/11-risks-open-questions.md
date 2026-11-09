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
| R7 | 2 GB laptop is unreliable for public traffic | 5 | 4 | 20 | Private beta only; move to 4 GB VPS before public launch; Cloudflare Tunnel; backups | DevOps | Public launch gate |
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

### Top 5 to watch weekly

1. R7 — laptop reliability vs public launch.
2. R1 — AniList permission.
3. R17 — scope/burnout.
4. R4/R5 — image and synopsis copyright.
5. R9 — schedule/streaming accuracy.

---

## 2. Open questions

Answer these before or during Phase 0. Defaults are in brackets.

| # | Question | Why it matters | Default if unanswered | Owner | Deadline |
|---|---|---|---|---|---|
| Q1 | Has AniList replied? What is the timeline? | Determines provider roadmap | Assume no; ODbL + manual | Founder | Week 2 |
| Q2 | Is the laptop dedicated to serving, always on, wired, with UPS? | Uptime and public launch | Private beta only | Founder | Week 1 |
| Q3 | Can we spend ~$5–10/month on a 4 GB VPS before public launch? | Public reliability | Use laptop for beta; gate public launch | Founder | Week 4 |
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
| Q14 | If AniList is denied, is there budget for a commercial data provider? | Catalog quality | No; ODbL + manual | Founder | Week 4 |
| Q15 | Do we need English UI in year one? | Routing/content workload | No; Indonesian only | Product | Phase 4 |
| Q16 | Who is on-call for incidents? | Ops readiness | Founder + dev | Founder | Launch |
| Q17 | What is the exact public launch date? | Roadmap | End of Week 6 | Lead | Week 1 |
| Q18 | Are reviews/comments in scope before PSE registration? | Legal risk | No; defer UGC | Legal | Week 1 |

---

## 3. Decision log

| Date | Decision | Rationale | Status |
|---|---|---|---|
| 9 Nov 2026 | Request written AniList permission; no ingestion until approved | ToS prohibits storage and competing trackers | Accepted |
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

---

## 4. Triggers that change the plan

| If this happens | Then |
|---|---|
| AniList grants written permission | Enable `PROVIDER_ANILIST_ENABLED`; add sync jobs; keep manual overrides; update privacy/attribution |
| AniList denies permission | Stay on ODbL + manual; remove any AniList data; evaluate licensed provider |
| VPS budget approved | Move lean Compose to 4 GB VPS; keep laptop as staging |
| Traffic > 50k/month or search complaints | Add Meilisearch; consider 3-server target |
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

**Start with Phase 0, and make the single best first task the AniList permission email + ODbL legal review — before writing catalog code.**

Why: every downstream choice (schema provenance, provider abstraction, image policy, content workflow) depends on what data we are legally allowed to store. The engineering can proceed in parallel on the catalog shell and seed, but the legal gate must be opened first. If AniList says yes, the roadmap accelerates; if not, the ODbL + manual plan is already the launch path and nothing is wasted.

### First task checklist (this week)

- [ ] Send the AniList permission request (template in `05-data-sync.md`).
- [ ] Book a 1-hour legal review of ODbL attribution/share-alike and image use.
- [ ] Confirm domain, editor hours, and the VPS decision date.
- [ ] Create the workspace skeleton and pin Prisma/Better Auth/Next versions.
- [ ] Download the ODbL dump and measure seed time/size on the laptop.
- [ ] Build the first admin-only page that lists 20 seeded anime and one schedule row.

That gives the team a real end-to-end slice — data → database → page — while the legal answer is pending.
