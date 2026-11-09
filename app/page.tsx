/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Info,
  PlayCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { JsonLd } from "@/components/json-ld";
import { MediaGrid } from "@/components/media-grid";
import { PlatformCard } from "@/components/platform-card";
import { ScheduleCard } from "@/components/schedule-card";
import { SectionHeading } from "@/components/section-heading";
import {
  CURRENT_SEASON,
  MOODS,
  SITE_URL,
} from "@/lib/constants";
import {
  getGenres,
  getPlatforms,
  getSiteStats,
  getTodaySchedule,
  listMedia,
} from "@/lib/repository";
import type { MediaSummary } from "@/lib/types";
import {
  coverFallback,
  formatDateId,
  formatSeasonLong,
  formatScore,
} from "@/lib/utils";

export const metadata: Metadata = {
  title: "Jadwal Anime, Sinopsis, dan Platform Legal Indonesia",
  description:
    "Jadwal tayang anime dalam WIB, sinopsis bahasa Indonesia, dan tautan ke platform legal. Mulai dari musim Fall 2026.",
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const [stats, today, season, reviewed, platforms, genres] = await Promise.all([
    getSiteStats(),
    getTodaySchedule(),
    listMedia({ season: CURRENT_SEASON.season, year: CURRENT_SEASON.year, sort: "populer", pageSize: 12 }),
    listMedia({ contentStatus: "REVIEWED", sort: "skor", pageSize: 12 }),
    getPlatforms(),
    getGenres(),
  ]);

  const featured = season.items.slice(0, 3);
  const todayItems = today.items.slice(0, 8);
  const popularGenres = genres.filter((genre) => (genre.count ?? 0) > 0).slice(0, 10);

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Anime ${formatSeasonLong(CURRENT_SEASON.season)} ${CURRENT_SEASON.year}`,
    numberOfItems: season.items.length,
    itemListElement: season.items.slice(0, 10).map((media, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: media.title,
      url: `${SITE_URL}/anime/${media.slug}`,
    })),
  };

  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/15 via-transparent to-amber/10" />
        <div className="hero-grid pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-10 sm:px-6 sm:pb-14 sm:pt-14 lg:px-8 lg:pb-20 lg:pt-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-brand/25 bg-brand/10 px-3 py-1.5 text-[11px] font-semibold text-brand">
                <Sparkles className="h-3.5 w-3.5" />
                Musim {formatSeasonLong(CURRENT_SEASON.season)} {CURRENT_SEASON.year}
                <span className="text-brand/60">·</span>
                <span className="text-ink/70">{stats.currentSeason} judul</span>
              </div>

              <h1 className="mt-5 max-w-2xl text-balance text-[34px] font-extrabold leading-[1.06] tracking-[-0.045em] text-ink sm:text-5xl lg:text-[56px]">
                Anime, dalam{" "}
                <span className="bg-gradient-to-r from-brand to-amber bg-clip-text text-transparent">
                  WIB
                </span>
                . Tanpa drama platform.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-muted sm:text-base">
                Jadwal tayang, sinopsis bahasa Indonesia, dan tautan ke platform legal.
                Dibuat untuk penonton Indonesia yang ingin cepat tahu{" "}
                <span className="font-semibold text-ink">kapan tayang</span> dan{" "}
                <span className="font-semibold text-ink">di mana menontonnya</span>.
              </p>

              <div className="mt-6 flex flex-wrap gap-2.5">
                <Link
                  href="/jadwal-tayang"
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-white shadow-glow transition-colors hover:bg-brand-strong"
                >
                  <CalendarDays className="h-4 w-4" />
                  Jadwal hari ini
                </Link>
                <Link
                  href={`/musim/${CURRENT_SEASON.season.toLowerCase()}-${CURRENT_SEASON.year}`}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-surface/80 px-5 text-sm font-bold text-ink transition-colors hover:bg-surface-2"
                >
                  Telusuri musim
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-8 grid max-w-md grid-cols-3 gap-4 border-t border-line/80 pt-5">
                <Stat value={stats.media} label="judul katalog" />
                <Stat value={stats.genres} label="genre" />
                <Stat value={stats.platforms} label="platform legal" />
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-6 rounded-[2rem] bg-brand/10 blur-2xl" />
              <div className="relative grid grid-cols-3 items-end gap-2.5 sm:gap-3">
                {featured.map((media, index) => (
                  <HeroPoster key={media.slug} media={media} index={index} />
                ))}
              </div>
              <div className="relative mt-4 flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface/85 p-3 backdrop-blur sm:mt-6">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-success/15 text-success">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-[11px] font-bold text-ink">Hanya platform legal</p>
                    <p className="text-[10px] text-muted">Tidak ada tautan streaming ilegal.</p>
                  </div>
                </div>
                <Link
                  href="/platform"
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold text-brand hover:bg-brand-soft"
                >
                  Lihat
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-amber/25 bg-amber/5 px-3.5 py-3 text-[11px] leading-5 text-muted sm:items-center">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber sm:mt-0" />
          <p>
            <span className="font-semibold text-ink">Versi beta.</span> Jadwal Fall 2026
            masih estimasi dan ketersediaan platform belum diverifikasi per judul. Sinopsis
            yang belum ditinjau tidak diindeks mesin pencari.{" "}
            <Link href="/tentang" className="font-semibold text-brand hover:underline">
              Baca kebijakan data
            </Link>
            .
          </p>
        </div>

        <section className="mt-12" aria-labelledby="jadwal-hari-ini">
          <SectionHeading
            eyebrow={formatDateId(today.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            title="Tayang hari ini"
            description="Jam dalam WIB. Geser untuk melihat judul lainnya."
            href="/jadwal-tayang"
            linkLabel="Jadwal 7 hari"
          />
          {todayItems.length > 0 ? (
            <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
              {todayItems.map((item) => (
                <ScheduleCard key={`${item.media.slug}-${item.id}`} item={item} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Belum ada jadwal untuk hari ini"
              description="Coba lihat jadwal minggu ini atau telusuri musim Fall 2026."
              href="/jadwal-tayang"
              linkLabel="Buka jadwal"
            />
          )}
        </section>

        <section className="mt-14" aria-labelledby="musim-ini">
          <SectionHeading
            eyebrow={`${formatSeasonLong(CURRENT_SEASON.season)} ${CURRENT_SEASON.year}`}
            title="Sedang tayang"
            description="Judul musim ini, diurutkan dari yang paling relevan di katalog."
            href={`/musim/${CURRENT_SEASON.season.toLowerCase()}-${CURRENT_SEASON.year}`}
          />
          <MediaGrid media={season.items} />
        </section>

        <section className="mt-14" aria-labelledby="pilihan-klasik">
          <SectionHeading
            eyebrow="Kurasi Nimelist"
            title="Pilihan klasik"
            description="Sudah punya sinopsis bahasa Indonesia yang ditinjau. Cocok untuk mulai menonton."
            href="/anime?sort=skor"
            linkLabel="Lihat katalog"
          />
          {reviewed.items.length > 0 ? (
            <MediaGrid media={reviewed.items} />
          ) : (
            <EmptyState
              title="Belum ada kurasi"
              description="Sinopsis yang sudah ditinjau akan muncul di sini."
              href="/anime"
              linkLabel="Jelajah katalog"
            />
          )}
        </section>

        <section className="mt-14" aria-labelledby="platform-legal">
          <SectionHeading
            eyebrow="Tonton dengan tenang"
            title="Platform legal"
            description="Nimelist tidak menyediakan streaming. Kami hanya membantu kamu menemukan judul di platform resmi."
            href="/platform"
            linkLabel="Semua platform"
          />
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {platforms.map((platform) => (
              <PlatformCard key={platform.slug} platform={platform} />
            ))}
          </div>
        </section>

        <section className="mt-14" aria-labelledby="genre-populer">
          <SectionHeading
            eyebrow="Mulai dari selera"
            title="Jelajah genre"
            description="Dari isekai sampai slice of life—temukan judul sesuai mood."
            href="/genre"
            linkLabel="Semua genre"
          />
          <div className="flex flex-wrap gap-2">
            {popularGenres.map((genre) => (
              <Link
                key={genre.slug}
                href={`/genre/${genre.slug}`}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-2 text-xs font-semibold text-muted transition-colors hover:border-brand/40 hover:bg-brand-soft hover:text-brand"
              >
                {genre.nameId}
                <span className="font-mono text-[10px] text-muted/70">{genre.count}</span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-14 grid gap-4 md:grid-cols-3" aria-label="Cara Nimelist bekerja">
          <Step
            icon={Clock3}
            title="1. Cek jadwal WIB"
            description="Waktu tayang disajikan dalam WIB. Tidak perlu menghitung selisih zona waktu."
          />
          <Step
            icon={Search}
            title="2. Baca sinopsis"
            description="Sinopsis orisinal berbahasa Indonesia, ditinjau sebelum diterbitkan."
          />
          <Step
            icon={PlayCircle}
            title="3. Tonton di platform legal"
            description="Tautan membuka platform resmi. Ketersediaan judul bisa berbeda per region."
          />
        </section>

        <section className="mt-14 overflow-hidden rounded-3xl border border-line bg-surface p-6 sm:p-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-brand">
                Mulai dari sini
              </p>
              <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-ink">
                Bingung mau nonton apa?
              </h2>
              <p className="mt-1.5 max-w-xl text-sm leading-6 text-muted">
                Pilih suasana, lalu biarkan katalog mencarikan judul yang cocok.
              </p>
            </div>
            <Link
              href="/anime"
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl bg-brand px-5 text-sm font-bold text-white transition-colors hover:bg-brand-strong"
            >
              Jelajah katalog
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-6 grid gap-2.5 sm:grid-cols-3">
            {MOODS.map((mood) => (
              <Link
                key={mood.href}
                href={mood.href}
                className="group rounded-2xl border border-line bg-canvas p-4 transition-colors hover:border-brand/40 hover:bg-brand-soft/30"
              >
                <h3 className="text-sm font-bold text-ink group-hover:text-brand">{mood.title}</h3>
                <p className="mt-1 text-[11px] leading-5 text-muted">{mood.description}</p>
                <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-brand">
                  Buka
                  <ArrowRight className="h-3 w-3" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <JsonLd data={itemListJsonLd} />
    </>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="font-mono text-xl font-bold tracking-tight text-ink">{value}</p>
      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-muted">{label}</p>
    </div>
  );
}

function HeroPoster({ media, index }: { media: MediaSummary; index: number }) {
  const rotations = ["rotate-[-2deg]", "rotate-[1.5deg]", "rotate-[-1deg]"];
  const offsets = ["translate-y-4", "translate-y-0", "translate-y-8"];
  return (
    <Link
      href={`/anime/${media.slug}`}
      className={`group relative block aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-surface-2 shadow-card transition-transform duration-300 hover:z-10 hover:-translate-y-2 hover:rotate-0 ${rotations[index]} ${offsets[index]}`}
    >
      {media.coverUrl ? (
        <img
          src={media.coverUrl}
          alt={`Poster ${media.title}`}
          loading={index === 0 ? "eager" : "lazy"}
          fetchPriority={index === 0 ? "high" : "auto"}
          decoding="async"
          referrerPolicy="no-referrer"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      ) : (
        <span className="poster-fallback flex h-full items-center justify-center font-mono text-xl font-bold text-white/80">
          {coverFallback(media.title)}
        </span>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/45 to-transparent p-2.5 pt-10">
        <p className="line-clamp-2 text-[10px] font-bold leading-tight text-white">
          {media.title}
        </p>
        <div className="mt-1 flex items-center justify-between gap-1">
          <span className="font-mono text-[9px] text-white/65">
            {media.seasonYear ?? ""}
          </span>
          {typeof media.scoreAvg === "number" && (
            <span className="inline-flex items-center gap-0.5 font-mono text-[9px] font-bold text-amber">
              <Star className="h-2.5 w-2.5 fill-current" />
              {formatScore(media.scoreAvg)}
            </span>
          )}
        </div>
      </div>
      {index === 1 && (
        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-brand px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wide text-white">
          <CheckCircle2 className="h-2.5 w-2.5" />
          Pilihan
        </span>
      )}
    </Link>
  );
}

function Step({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Clock3;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-soft text-brand">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <h3 className="mt-3 text-sm font-bold text-ink">{title}</h3>
      <p className="mt-1 text-[11px] leading-5 text-muted">{description}</p>
    </div>
  );
}
