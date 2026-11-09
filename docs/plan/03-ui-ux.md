# 03 — UI/UX Design

## 1. Design principles

1. **Jawab dulu, hias kemudian.** The schedule time, platform, and synopsis are the hero. Decoration never delays them.
2. **Mobile-first, thumb-first.** The majority of traffic is a mid-range Android phone on 4G. Design at 360 px first.
3. **Fast is a feature.** Every client component must justify its JavaScript. Prefer Server Components.
4. **Indonesian by default.** Copy, dates, times, and tone are local. No awkward translated UI.
5. **Legal confidence.** “Platform legal” is a first-class concept, not a footer disclaimer.
6. **Accessible and readable.** WCAG 2.2 AA, 4.5:1 text contrast, 44 px targets, visible focus.
7. **Calm anime aesthetic.** Poster-led, dark-first, but not a neon arcade. Content stays legible at 200% zoom.

---

## 2. Visual direction

| Token | Value | Notes |
|---|---|---|
| Brand accent | Indigo/violet `#6D5EF8` | Primary actions, links, active nav |
| Accent hover | `#5B4CE0` | |
| Secondary accent | Warm amber `#F5A524` | Ratings, “today” highlight |
| Success | `#12B76A` | “Tayang hari ini”, verified |
| Warning | `#F79009` | Schedule changed / unverified |
| Danger | `#F04438` | Destructive, report |
| Surface light | `#FFFFFF`, `#F7F7FA` | |
| Surface dark | `#0B0B10`, `#15151D` | |
| Text light | `#17171C`, `#5C5C6B` | |
| Text dark | `#F5F5F7`, `#A6A6B3` | |
| Border | `#E6E6EC` / `#2A2A35` | |

**Typography:** **Plus Jakarta Sans** (Indonesian typeface by Tokotype) for UI and headings; `Geist Mono` for episode numbers, scores, and timestamps. Load with `next/font`, subset `latin`, `display: swap`. Fallback system sans. Avoid a second display font at launch.

**Shape:** 12–16 px radii for cards, 999 px for pills, 8 px for inputs. Subtle borders, no heavy shadows. One soft shadow for elevated sheets/dialogs.

**Spacing:** 4 px base; 8/12/16/24/32/48. Max content width 1280 px; reading column max 720 px.

**Iconography:** Lucide (ships with shadcn/ui). 20/24 px; 1.75 stroke. Icons always paired with labels on mobile nav.

**Motion:** 150–200 ms ease-out for hover/press; 250 ms for sheets. Respect `prefers-reduced-motion`. No parallax, no autoplay.

---

## 3. Navigation

### Mobile (< 768 px)

- **Top app bar:** logo (compact), search icon, avatar/login.
- **Bottom navigation:** Beranda, Jelajah, Jadwal, Daftar, Profil.
- Bottom nav respects safe-area inset. Active item uses accent + label weight, not color alone.
- Search opens a full-screen sheet with recent/suggested queries.
- Filters open a bottom sheet; apply button sticky.

```text
┌──────────────────────────────┐
│ Nimelist        [🔍]  [👤]   │
├──────────────────────────────┤
│                              │
│         page content         │
│                              │
├──────────────────────────────┤
│  🏠      🧭      📅     📚    │
│ Beranda Jelajah Jadwal Daftar│
└──────────────────────────────┘
```

### Desktop (≥ 1024 px)

- Sticky header: logo, Beranda, Jelajah, Jadwal, Musim, Platform, search, avatar.
- Max width 1280 px; 12-column grid; sidebar filters on catalog pages.
- Footer: about, legal, platform list, copyright/takedown, social.

---

## 4. Key wireframes

### 4.1 Home

```text
┌────────────────────────────────────────────────────────────┐
│ Header: logo  Beranda Jelajah Jadwal Musim Platform  🔍 👤 │
├────────────────────────────────────────────────────────────┤
│ HERO / CURRENT SEASON                                      │
│  Anime Fall 2026                                   [Lihat] │
│  Jadwal tayang WIB, sinopsis, dan platform legal.          │
│  [Jadwal hari ini]  [Telusuri musim]                       │
├────────────────────────────────────────────────────────────┤
│ TAYANG HARI INI · Senin, 9 Nov 2026            [WIB ▾]     │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                        │
│ │poster│ │poster│ │poster│ │poster│   horizontal scroll    │
│ │20.00 │ │21.00 │ │22.30 │ │23.00 │                        │
│ └──────┘ └──────┘ └──────┘ └──────┘                        │
├────────────────────────────────────────────────────────────┤
│ POPULER MUSIM INI                              [Lihat semua]│
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐                  │
│ │    │ │    │ │    │ │    │ │    │ │    │                  │
│ └────┘ └────┘ └────┘ └────┘ └────┘ └────┘                  │
├────────────────────────────────────────────────────────────┤
│ PLATFORM LEGAL                                             │
│ [Bstation] [Crunchyroll] [Netflix] [iQIYI] [Vidio] ...      │
├────────────────────────────────────────────────────────────┤
│ Footer: Tentang · Kebijakan Privasi · Ketentuan · Kontak    │
└────────────────────────────────────────────────────────────┘
```

### 4.2 Catalog / browse

```text
┌────────────────────────────────────────────────────────────┐
│ Anime                                          [Filter 2]  │
├────────────────────────────────────────────────────────────┤
│ [Semua] [Sedang Tayang] [Selesai] [Akan Datang]             │
│ [Genre ▾] [Musim ▾] [Platform ▾] [Urutkan ▾]                │
├────────────────────────────────────────────────────────────┤
│ 24 judul                                                   │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                        │
│ │poster│ │poster│ │poster│ │poster│                        │
│ │Title │ │Title │ │Title │ │Title │                        │
│ │★8.4  │ │★8.1  │ │★7.9  │ │★8.7  │                        │
│ │Bstation│ │Netflix│ │—     │ │Crunchy│                       │
│ └──────┘ └──────┘ └──────┘ └──────┘                        │
│ ...                                                        │
│ [Muat lebih banyak] or [1] [2] [3] ...                     │
└────────────────────────────────────────────────────────────┘
```

Mobile: 2 columns; tablet 3–4; desktop 5–6. Poster ratio 2:3. Title max 2 lines; score + platform badge in a compact row. Never rely on hover.

### 4.3 Anime detail

```text
┌────────────────────────────────────────────────────────────┐
│ Beranda / Anime / Sousou no Frieren                         │
├────────────────────────────────────────────────────────────┤
│ ┌──────────┐  Sousou no Frieren                            │
│ │          │  Frieren: Beyond Journey's End                │
│ │  poster  │  ★ 8.9 · 28 episode · Fall 2023 · Selesai      │
│ │          │  [Tambah ke Daftar]  [Bagikan]                 │
│ └──────────┘  Genre: [Fantasy] [Adventure] [Drama]          │
│               Studio: Madhouse                              │
├────────────────────────────────────────────────────────────┤
│ TAYANG DI PLATFORM LEGAL                                   │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Bstation · Sub Indonesia · 28 episode  [Tonton]  ✔     │ │
│ │ Crunchyroll · Sub Indonesia · 28 episode [Tonton] ✔    │ │
│ │ Terakhir dicek: 9 Nov 2026 · Laporkan tautan rusak     │ │
│ └────────────────────────────────────────────────────────┘ │
├────────────────────────────────────────────────────────────┤
│ SINOPSIS                                                   │
│ [Indonesian synopsis, 2–4 paragraphs, spoiler-safe]        │
│ Ditinjau oleh Sari · Diperbarui 9 Nov 2026                 │
├────────────────────────────────────────────────────────────┤
│ JADWAL TAYANG (WIB)                                        │
│ Senin, 20.00 WIB · Episode 5 · Bstation                     │
│ [Lihat semua jadwal]                                       │
├────────────────────────────────────────────────────────────┤
│ INFORMASI                                                  │
│ Judul alternatif: 葬送のフリーレン / Frieren ...            │
│ Musim: Fall 2023 · Durasi: 24 menit · Sumber: Manga        │
├────────────────────────────────────────────────────────────┤
│ KARAKTER & STAF (later)                                    │
│ [Frieren] [Fern] [Stark] ...                               │
├────────────────────────────────────────────────────────────┤
│ ANIME TERKAIT                                              │
│ [poster] [poster] [poster]                                 │
├────────────────────────────────────────────────────────────┤
│ ULASAN (later)                                             │
│ [Review cards]                                             │
└────────────────────────────────────────────────────────────┘
```

**Above the fold on mobile:** poster thumbnail (not huge), title, score/episodes/status, primary “Tambah ke Daftar”, and the first streaming row. The streaming section must be visible before the synopsis, because “where to watch” is the top intent.

### 4.4 Schedule

```text
┌────────────────────────────────────────────────────────────┐
│ Jadwal Tayang                                  [WIB ▾]     │
│ Senin, 9 November 2026                                     │
├────────────────────────────────────────────────────────────┤
│ [Hari ini] [Sel] [Rab] [Kam] [Jum] [Sab] [Min]             │
│ [Semua platform ▾] [Semua genre ▾]                         │
├────────────────────────────────────────────────────────────┤
│ 16.00  ─────────────────────────────────────────────────    │
│        ┌────┐  Title A                         Bstation     │
│        │post│  Episode 5 · 24 menit                        │
│        └────┘                                              │
│ 20.00  ─────────────────────────────────────────────────    │
│        ┌────┐  Title B                         Crunchyroll  │
│        │post│  Episode 8 · Sub Indonesia                   │
│        └────┘                                              │
│ 22.30  ─────────────────────────────────────────────────    │
│        ┌────┐  Title C                         —             │
│        │post│  Episode 3 · Jadwal dapat berubah             │
│        └────┘                                              │
├────────────────────────────────────────────────────────────┤
│ Zona waktu: WIB · WITA · WIT                               │
└────────────────────────────────────────────────────────────┘
```

- Default date = today in Asia/Jakarta.
- Past dates are read-only; future dates are estimates and labelled.
- Show “Jadwal dapat berubah” when `confidence = ESTIMATED`.
- Timezone toggle is client-side; default WIB. Persist preference in a cookie.
- Avoid a client-side clock that causes hydration mismatch: render WIB on the server, then adjust after mount.

### 4.5 Season

```text
┌────────────────────────────────────────────────────────────┐
│ Anime Fall 2026                                            │
│ 54 judul · 12 platform legal                               │
├────────────────────────────────────────────────────────────┤
│ [Sedang Tayang] [Selesai] [Akan Datang] [Semua]             │
│ [Genre ▾] [Platform ▾] [Urutkan: Populer ▾]                 │
├────────────────────────────────────────────────────────────┤
│ [poster grid]                                              │
├────────────────────────────────────────────────────────────┤
│ [← Summer 2026]                         [Winter 2027 →]     │
└────────────────────────────────────────────────────────────┘
```

### 4.6 Watchlist (Phase 2)

```text
┌────────────────────────────────────────────────────────────┐
│ Daftar Saya                                                │
│ [Sedang Ditonton 12] [Selesai 48] [Rencana 30] [Ditunda 4] │
├────────────────────────────────────────────────────────────┤
│ ┌────┐ Title A                          Ep 5/12  [−][+]    │
│ │post│ ★ 8.0 · Sedang Ditonton · 20.00 WIB                 │
│ └────┘ [Ubah status ▾] [Catatan]                           │
│ ┌────┐ Title B                          Ep 12/12 [Selesai] │
│ │post│ ★ 9.0 · Selesai · 8 Nov 2026                       │
│ └────┘                                                     │
├────────────────────────────────────────────────────────────┤
│ Filter: status · genre · platform · tahun                   │
└────────────────────────────────────────────────────────────┘
```

Quick progress update is the most important interaction: one tap +1, long-press to set exact episode. Optimistic UI with Server Action; revert on error.

### 4.7 Profile (Phase 2)

```text
┌────────────────────────────────────────────────────────────┐
│ [avatar] Sari                          [Ikuti] [Bagikan]   │
│ @sari · Bergabung Nov 2026 · 24 ulasan                     │
│ “Suka anime slice of life dan mystery.”                    │
├────────────────────────────────────────────────────────────┤
│ [Daftar] [Ulasan] [Statistik] [Pengikut] [Mengikuti]        │
├────────────────────────────────────────────────────────────┤
│ Statistik: 128 anime · 1.240 episode · rata-rata 8.1       │
│ Genre favorit: [Mystery] [Slice of Life] [Drama]           │
├────────────────────────────────────────────────────────────┤
│ Daftar publik (jika diizinkan)                             │
└────────────────────────────────────────────────────────────┘
```

### 4.8 Review editor (Phase 4)

```text
┌────────────────────────────────────────────────────────────┐
│ Tulis ulasan: Sousou no Frieren                            │
├────────────────────────────────────────────────────────────┤
│ Judul ulasan [__________________________________________]   │
│ Rating [1..10]  [ ] Spoiler                                │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Markdown editor                                        │ │
│ │                                                        │ │
│ └────────────────────────────────────────────────────────┘ │
│ [Pratinjau]  [Simpan draf]  [Terbitkan]                    │
│ Dengan menerbitkan, kamu setuju dengan Pedoman Komunitas.  │
└────────────────────────────────────────────────────────────┘
```

### 4.9 Auth

```text
┌────────────────────────────────────────────────────────────┐
│                  Masuk ke Nimelist                         │
│  [G] Lanjut dengan Google                                  │
│  [D] Lanjut dengan Discord                                 │
│  ─────────── atau ───────────                              │
│  Email [________________________]  [Kirim kode masuk]       │
│  Kami akan mengirim tautan/kode. Tanpa kata sandi.         │
│  Dengan masuk, kamu setuju Ketentuan & Kebijakan Privasi.  │
└────────────────────────────────────────────────────────────┘
```

### 4.10 Empty / error / loading

```text
EMPTY: "Belum ada anime di filter ini." [Reset filter] [Lihat musim ini]
ERROR: "Gagal memuat data." [Coba lagi] [Beranda]  (Sentry event id hidden)
404:   "Halaman tidak ditemukan." [Cari anime] [Jadwal hari ini]
OFFLINE: "Kamu sedang offline." [Coba lagi]
```

Skeletons match the final layout (poster grid, detail header, schedule rows) to avoid CLS. Do not use a global spinner for route transitions.

---

## 5. Component inventory

### shadcn/ui primitives

| Component | Use |
|---|---|
| `Button` | Primary/secondary/ghost/destructive; loading state |
| `Input`, `Textarea` | Search, forms, review editor |
| `Select`, `Combobox`, `Command` | Filters, search palette |
| `Dialog`, `AlertDialog` | Confirm delete/report; keyboard accessible |
| `Sheet`, `Drawer` | Mobile filters, search, navigation |
| `Tabs` | Schedule days, profile tabs, season status |
| `Card` | Poster card, streaming row, review card |
| `Badge` | Genre, platform, status, spoiler |
| `Avatar` | User profile |
| `DropdownMenu` | User menu, row actions |
| `Popover` | Score picker, timezone |
| `Tooltip` | Icon-only actions (desktop) |
| `Sonner` / `Toast` | Save confirmation, errors |
| `Skeleton` | Loading states |
| `Progress` | Watch progress |
| `Slider` | Score input (with numeric fallback) |
| `Switch`, `Checkbox`, `RadioGroup` | Privacy, spoiler, filters |
| `Form` | React Hook Form + Zod validation |
| `Table` | Admin lists |
| `Pagination` | Catalog pages |
| `Breadcrumb` | SEO + orientation |
| `Alert` | Schedule changes, legal notice |
| `Accordion`, `Collapsible` | FAQ, filters, info sections |
| `ScrollArea` | Horizontal poster rails |
| `Separator` | Layout |
| `HoverCard` | Desktop anime preview (progressive enhancement) |
| `NavigationMenu` | Desktop header |
| `Sidebar` | Admin |

### Custom components

| Component | Responsibility |
|---|---|
| `PosterCard` | 2:3 image, title, score, platform badge, link |
| `PosterGrid` | Responsive grid with skeletons |
| `MediaHero` | Detail header: poster, titles, meta, actions |
| `TitleAliases` | Romaji/English/native/Indonesian display |
| `ScoreBadge` | One decimal, star icon, accessible label |
| `StatusBadge` | Airing/completed/upcoming |
| `StreamingRow` | Platform, language, episodes, CTA, verified date |
| `StreamingList` | Legal platforms + fallback message |
| `ScheduleDayTabs` | 7-day navigation, today highlight |
| `ScheduleRow` | Time, poster, title, episode, platform, confidence |
| `TimezoneToggle` | WIB/WITA/WIT, cookie persistence |
| `Countdown` | Client-only “Tayang dalam 2 jam” (hydrate-safe) |
| `AddToListButton` | Phase 2; status menu |
| `ProgressStepper` | Episode +1/−1, exact input |
| `ReviewCard` | Author, score, spoiler gate, excerpt |
| `SpoilerGate` | Click to reveal |
| `EmptyState` | Icon, message, actions |
| `ErrorState` | Retry, Sentry id |
| `Breadcrumbs` | Visible + JSON-LD source |
| `JsonLd` | Safe serialization |
| `SearchDialog` | Typeahead, keyboard nav, recent |
| `FilterSheet` | Mobile filters |
| `PlatformBadge` | Logo + name, no misleading CTA |
| `VerifiedStamp` | “Terakhir dicek” |
| `ReportLink` | Broken link/content report |
| `ThemeToggle` | Light/dark/system |
| `SkipLink` | Accessibility |
| `AdSlot` | Reserved height placeholder (later) |

---

## 6. Responsive behavior

| Breakpoint | Width | Layout |
|---|---|---|
| `xs` | 360–479 | 2-col poster grid; bottom nav; full-screen search |
| `sm` | 480–767 | 2–3 col; bottom nav |
| `md` | 768–1023 | 3–4 col; header nav appears; sidebar filters |
| `lg` | 1024–1279 | 5 col; desktop header; sidebar |
| `xl` | ≥ 1280 | 6 col; max 1280 px content |

Rules:

- Touch targets ≥ 44×44 px; spacing between adjacent targets ≥ 8 px.
- Bottom nav height 64 px + safe area; content padding-bottom ≥ 80 px.
- Tables become cards on mobile; never horizontal-scroll a data table without a clear affordance.
- Sticky headers must not cover anchor targets; use `scroll-margin-top`.
- Filters use a sheet on mobile, sidebar on desktop.
- Hover previews are progressive enhancement only; all actions available on tap.
- Avoid hover-only “add to list”; always show a button.
- Test at 320 px width (small Android) and 200% text zoom.

---

## 7. Dark/light mode

- Default: **system**; user can choose light/dark/system.
- Persist in a cookie (server-readable) and `localStorage` fallback.
- Avoid flash: inline script in `<head>` sets `class="dark"` before paint, or use `next-themes` with `attribute="class"`.
- Use CSS variables in `globals.css`; no hard-coded hex in components.
- Dark surfaces: `#0B0B10` background, `#15151D` cards, `#2A2A35` borders.
- Light surfaces: `#FFFFFF`, `#F7F7FA`, `#E6E6EC`.
- Contrast: body text ≥ 4.5:1; large text ≥ 3:1; focus ring ≥ 3:1.
- Poster images may have white edges; add a subtle border/inset in dark mode.
- Platform logos: provide monochrome/white variants or a neutral chip; do not invert brand colors incorrectly.

---

## 8. Accessibility (WCAG 2.2 AA)

- Semantic landmarks: `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`.
- One `<h1>` per page; headings in order.
- Skip link to `#main`.
- Visible focus ring on all interactive elements; never `outline: none` without replacement.
- Keyboard: all filters, tabs, dialogs, menus, search, and score picker usable.
- `aria-current="page"` on nav; `aria-selected` on tabs.
- Dialog focus trap and restore; Escape closes.
- Form labels always visible; errors linked with `aria-describedby`; `aria-invalid`.
- Images: meaningful `alt` (`Poster anime {title}`); decorative images `alt=""`.
- Icon-only buttons have `aria-label`.
- Color is not the only status indicator: add text/icon.
- Spoiler gate is keyboard accessible and announces state.
- Timezone and dates use `<time datetime="...">`.
- `lang="id"` on `<html>`; Japanese titles wrapped in `lang="ja"` where helpful.
- Reduced motion: disable countdown animation, sheet spring, and hover transforms.
- Captions/transcripts for any video (none at launch).
- Test with NVDA/VoiceOver, keyboard only, 200% zoom, and high contrast.

---

## 9. Loading, empty, and error states

| State | Pattern |
|---|---|
| Route loading | `loading.tsx` skeleton matching layout |
| Data fetch inside page | `<Suspense>` with section skeleton, not full-page spinner |
| Search typeahead | Inline skeleton rows after 150 ms; cancel stale requests |
| Empty catalog | Explain filter + reset + suggest season |
| Empty schedule day | “Tidak ada anime yang tayang” + next day link |
| No streaming link | “Belum tersedia di platform legal ID” + report/notify (later) |
| Broken link report | Toast confirmation + mod queue |
| 404 | Search + schedule + season links |
| 500 | Error boundary + retry + Sentry event id (not shown raw) |
| Offline | Service worker fallback later |
| Rate limited | “Terlalu banyak permintaan. Coba lagi dalam X detik.” |
| Unauthorized | Redirect to login with `next` param, no open redirect |
| Forbidden | 403 page, no data leak |

---

## 10. Microcopy (Indonesian)

| Context | Copy |
|---|---|
| Primary CTA | `Tonton di {platform}` |
| Secondary CTA | `Lihat detail` |
| Add to list | `Tambah ke Daftar` |
| Statuses | `Sedang Ditonton`, `Selesai`, `Rencana`, `Ditunda`, `Dihentikan` |
| Progress | `Episode {n} dari {total}` |
| Score | `Nilai {n}/10` |
| Schedule | `Jadwal Tayang`, `Tayang hari ini`, `Jadwal dapat berubah` |
| Timezone | `WIB`, `WITA`, `WIT` |
| Verified | `Terakhir dicek {date}` |
| Not available | `Belum tersedia di platform legal Indonesia` |
| Report | `Laporkan tautan rusak` |
| Spoiler | `Mengandung spoiler. Klik untuk melihat.` |
| Empty | `Belum ada anime di filter ini.` |
| Error | `Gagal memuat data. Coba lagi.` |
| Legal | `Nimelist tidak menyediakan streaming. Kami hanya menampilkan informasi platform resmi.` |

Tone: friendly, direct, no slang that dates quickly, no ALL CAPS, no “sub indo” promises.

---

## 11. Design QA checklist

- [ ] 360 px, 390 px, 768 px, 1024 px, 1440 px screenshots.
- [ ] Dark and light mode on every key page.
- [ ] 200% text zoom, no clipping.
- [ ] Keyboard-only pass on search, filters, schedule tabs, dialogs.
- [ ] Screen reader pass on detail and schedule.
- [ ] LCP image has `priority`, width/height, and correct `sizes`.
- [ ] No layout shift from ads, images, or fonts.
- [ ] All status indicators have text, not color only.
- [ ] All images have appropriate alt text.
- [ ] All links have discernible names.
- [ ] Empty/error/loading states designed, not default browser UI.
- [ ] Indonesian copy reviewed by a native speaker.
- [ ] Platform logos used according to brand guidelines.
- [ ] No deceptive “play” buttons or fake streaming CTAs.
