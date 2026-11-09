import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, Sparkles } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CURRENT_SEASON, SEASON_LABELS } from "@/lib/constants";
import { getSeasons } from "@/lib/repository";
import { formatSeasonLong, seasonSlug } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Musim Anime — Arsip dan Musim Berjalan",
  description:
    "Telusuri anime berdasarkan musim: Winter, Spring, Summer, dan Fall. Lihat jumlah judul, jadwal, dan platform legal.",
  alternates: { canonical: "/musim" },
};

export default async function SeasonsPage() {
  const seasons = await getSeasons();
  const byYear = new Map<number, typeof seasons>();
  for (const season of seasons) {
    const list = byYear.get(season.year) ?? [];
    list.push(season);
    byYear.set(season.year, list);
  }
  const years = [...byYear.keys()].sort((a, b) => b - a);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <Breadcrumbs items={[{ label: "Beranda", href: "/" }, { label: "Musim" }]} />
      <header className="mt-5 border-b border-line pb-6">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-brand">
          Arsip katalog
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em] text-ink sm:text-4xl">
          Musim anime
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Setiap judul dikelompokkan berdasarkan musim tayang. Mulai dari musim berjalan
          atau telusuri arsip untuk menemukan klasik.
        </p>
        <Link
          href={`/musim/${CURRENT_SEASON.season.toLowerCase()}-${CURRENT_SEASON.year}`}
          className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-white transition-colors hover:bg-brand-strong"
        >
          <Sparkles className="h-4 w-4" />
          {formatSeasonLong(CURRENT_SEASON.season)} {CURRENT_SEASON.year}
        </Link>
      </header>

      <div className="mt-8 space-y-8">
        {years.map((year) => {
          const list = (byYear.get(year) ?? []).sort(
            (a, b) => (SEASON_LABELS[b.season]?.order ?? 0) - (SEASON_LABELS[a.season]?.order ?? 0),
          );
          return (
            <section key={year}>
              <div className="mb-3 flex items-center gap-3">
                <h2 className="font-mono text-lg font-bold text-ink">{year}</h2>
                <span className="h-px flex-1 bg-line" />
                <span className="text-[10px] text-muted">
                  {list.reduce((sum, item) => sum + item.count, 0)} judul
                </span>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                {list.map((season) => {
                  const isCurrent =
                    season.season === CURRENT_SEASON.season && season.year === CURRENT_SEASON.year;
                  return (
                    <Link
                      key={`${season.season}-${season.year}`}
                      href={`/musim/${seasonSlug(season.season, season.year)}`}
                      className={`group rounded-2xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-card ${
                        isCurrent
                          ? "border-brand/40 bg-brand-soft"
                          : "border-line bg-surface hover:border-brand/30"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-sm font-bold ${
                            isCurrent ? "text-brand" : "text-ink group-hover:text-brand"
                          }`}
                        >
                          {SEASON_LABELS[season.season]?.short ?? season.season}
                        </span>
                        {isCurrent && (
                          <span className="rounded-full bg-brand px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white">
                            Sekarang
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[10px] text-muted">
                        {SEASON_LABELS[season.season]?.months}
                      </p>
                      <p className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-muted">
                        <CalendarDays className="h-3 w-3" />
                        {season.count} judul
                      </p>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
