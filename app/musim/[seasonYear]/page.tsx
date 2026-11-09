import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, CheckCircle2, Sparkles } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { EmptyState } from "@/components/empty-state";
import { JsonLd } from "@/components/json-ld";
import { MediaGrid } from "@/components/media-grid";
import { CURRENT_SEASON, SITE_URL, STATUS_LABELS } from "@/lib/constants";
import {
  getSeasonSummary,
  getSeasons,
  listMedia,
} from "@/lib/repository";
import {
  formatSeasonLong,
  parseSeasonSlug,
  seasonLabel,
  seasonSlug,
} from "@/lib/utils";

type Params = Promise<{ seasonYear: string }>;

export async function generateStaticParams() {
  const seasons = await getSeasons();
  return seasons.map((item) => ({ seasonYear: seasonSlug(item.season, item.year) }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { seasonYear } = await params;
  const parsed = parseSeasonSlug(seasonYear);
  if (!parsed) return { title: "Musim tidak ditemukan", robots: { index: false, follow: false } };
  const summary = await getSeasonSummary(parsed.season, parsed.year);
  if (!summary) return { title: "Musim tidak ditemukan", robots: { index: false, follow: false } };
  const label = seasonLabel(parsed.season, parsed.year);
  return {
    title: `Anime ${label} — Jadwal Tayang WIB & Platform Legal`,
    description: `Daftar anime ${label} lengkap dengan jadwal WIB, genre, studio, dan tautan platform legal di Indonesia. ${summary.count} judul dalam katalog.`,
    alternates: { canonical: `/musim/${seasonYear}` },
    openGraph: {
      title: `Anime ${label}`,
      description: `Katalog anime ${label} dengan jadwal WIB dan platform legal.`,
      url: `${SITE_URL}/musim/${seasonYear}`,
    },
  };
}

export default async function SeasonPage({ params }: { params: Params }) {
  const { seasonYear } = await params;
  const parsed = parseSeasonSlug(seasonYear);
  if (!parsed) notFound();
  const [summary, result, seasons] = await Promise.all([
    getSeasonSummary(parsed.season, parsed.year),
    listMedia({ season: parsed.season, year: parsed.year, sort: "populer", pageSize: 60 }),
    getSeasons(),
  ]);
  if (!summary) notFound();

  const label = seasonLabel(parsed.season, parsed.year);
  const isCurrent =
    parsed.season === CURRENT_SEASON.season && parsed.year === CURRENT_SEASON.year;
  const currentIndex = seasons.findIndex(
    (item) => item.season === parsed.season && item.year === parsed.year,
  );
  const newer = currentIndex > 0 ? seasons[currentIndex - 1] : null;
  const older = currentIndex >= 0 && currentIndex < seasons.length - 1 ? seasons[currentIndex + 1] : null;
  const statusCounts = result.items.reduce<Record<string, number>>((counts, item) => {
    counts[item.status] = (counts[item.status] ?? 0) + 1;
    return counts;
  }, {});

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Anime ${label}`,
    numberOfItems: result.total,
    itemListElement: result.items.slice(0, 20).map((media, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: media.title,
      url: `${SITE_URL}/anime/${media.slug}`,
    })),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <Breadcrumbs
        items={[
          { label: "Beranda", href: "/" },
          { label: "Musim", href: "/musim" },
          { label },
        ]}
      />

      <section className="relative mt-5 overflow-hidden rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/10 via-transparent to-amber/10" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand/25 bg-brand/10 px-2.5 py-1 text-[10px] font-bold text-brand">
                <Sparkles className="h-3 w-3" />
                {isCurrent ? "Musim berjalan" : "Arsip musim"}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[10px] font-semibold text-muted">
                <CalendarDays className="h-3 w-3" />
                {formatSeasonLong(parsed.season)} · {parsed.year}
              </span>
            </div>
            <h1 className="mt-4 text-4xl font-extrabold tracking-[-0.045em] text-ink sm:text-5xl">
              Anime {label}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              {isCurrent
                ? "Jadwal tayang WIB, sinopsis, dan platform legal untuk musim yang sedang berjalan."
                : "Arsip katalog musim ini. Jadwal tayang ditampilkan sebagai referensi."}{" "}
              {summary.count} judul dalam katalog.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 border-t border-line pt-4 md:border-0 md:pt-0">
            <SeasonStat label="Judul" value={summary.count} />
            <SeasonStat label="Ditinjau" value={summary.reviewed} />
            <SeasonStat label="Tayang" value={statusCounts.RELEASING ?? 0} />
          </div>
        </div>
      </section>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Link
          href={`/anime?season=${seasonYear}`}
          className="rounded-full border border-brand/30 bg-brand-soft px-3 py-1.5 text-[11px] font-semibold text-brand"
        >
          Semua {summary.count}
        </Link>
        {["RELEASING", "FINISHED", "NOT_YET_RELEASED"].map((status) => (
          <Link
            key={status}
            href={`/anime?season=${seasonYear}&status=${status}`}
            className="rounded-full border border-line bg-surface px-3 py-1.5 text-[11px] font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            {STATUS_LABELS[status]} ({statusCounts[status] ?? 0})
          </Link>
        ))}
        <Link
          href={`/anime?season=${seasonYear}&sort=skor`}
          className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-[11px] font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <CheckCircle2 className="h-3 w-3 text-success" />
          Urutkan skor
        </Link>
      </div>

      <section className="mt-6">
        {result.items.length > 0 ? (
          <MediaGrid media={result.items} priorityCount={6} />
        ) : (
          <EmptyState
            title="Musim ini belum punya judul"
            description="Katalog musim ini belum diisi. Coba musim lain atau jelajahi seluruh katalog."
            href="/anime"
            linkLabel="Jelajah katalog"
          />
        )}
      </section>

      <nav className="mt-8 flex flex-col gap-2 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        {older ? (
          <Link
            href={`/musim/${seasonSlug(older.season, older.year)}`}
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-xs font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {seasonLabel(older.season, older.year)}
          </Link>
        ) : (
          <span />
        )}
        {newer ? (
          <Link
            href={`/musim/${seasonSlug(newer.season, newer.year)}`}
            className="inline-flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-xs font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-ink sm:text-right"
          >
            {seasonLabel(newer.season, newer.year)}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <span />
        )}
      </nav>

      <JsonLd data={itemListJsonLd} />
    </div>
  );
}

function SeasonStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <p className="font-mono text-xl font-bold text-ink">{value}</p>
      <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted">{label}</p>
    </div>
  );
}
