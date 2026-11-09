import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { CatalogFilters } from "@/components/catalog-filters";
import { EmptyState } from "@/components/empty-state";
import { MediaGrid } from "@/components/media-grid";
import { Pagination } from "@/components/pagination";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getCatalogFacets, listMedia } from "@/lib/repository";
import { STATUS_LABELS } from "@/lib/constants";
import {
  buildQuery,
  getSingleParam,
  parsePage,
  parseSeasonSlug,
  seasonSlug,
} from "@/lib/utils";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const params = await searchParams;
  const hasFilter = ["q", "genre", "season", "status", "format", "platform", "sort", "page"].some(
    (key) => Boolean(params[key]),
  );
  const q = getSingleParam(params.q);
  return {
    title: q ? `Hasil pencarian “${q}”` : "Jelajah Anime",
    description:
      "Telusuri katalog anime Nimelist berdasarkan genre, musim, status, format, dan platform legal.",
    alternates: { canonical: "/anime" },
    robots: hasFilter ? { index: false, follow: true } : { index: true, follow: true },
  };
}

export default function AnimePage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <Breadcrumbs items={[{ label: "Beranda", href: "/" }, { label: "Jelajah anime" }]} />
      <div className="mt-5 flex flex-col gap-2 border-b border-line pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-brand">
            Katalog
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em] text-ink sm:text-4xl">
            Jelajah anime
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Cari berdasarkan judul, genre, musim, status, atau platform. Filter tidak
            membuat halaman duplikat untuk mesin pencari.
          </p>
        </div>
        <Link
          href="/jadwal-tayang"
          className="inline-flex h-10 items-center gap-2 self-start rounded-xl border border-line bg-surface px-3.5 text-sm font-semibold text-ink transition-colors hover:bg-surface-2 sm:self-auto"
        >
          <Search className="h-4 w-4 text-brand" />
          Cari lewat jadwal
        </Link>
      </div>
      <Suspense fallback={<CatalogSkeleton />}>
        <CatalogContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function CatalogContent({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = getSingleParam(params.q);
  const genre = getSingleParam(params.genre);
  const status = getSingleParam(params.status);
  const format = getSingleParam(params.format);
  const platform = getSingleParam(params.platform);
  const sort = getSingleParam(params.sort) || "populer";
  const page = parsePage(params.page);
  const parsedSeason = parseSeasonSlug(getSingleParam(params.season));

  const filters = {
    q,
    genre,
    status,
    format,
    platform,
    sort,
    page,
    season: parsedSeason?.season,
    year: parsedSeason?.year,
    pageSize: 24,
  };

  const [facets, result] = await Promise.all([getCatalogFacets(), listMedia(filters)]);
  const queryParams = {
    q,
    genre,
    season: parsedSeason ? seasonSlug(parsedSeason.season, parsedSeason.year) : "",
    status,
    format,
    platform,
    sort,
  };

  return (
    <>
      <div className="mt-5">
        <CatalogFilters
          facets={facets}
          values={{
            q,
            genre,
            season: parsedSeason ? seasonSlug(parsedSeason.season, parsedSeason.year) : "",
            status,
            format,
            platform,
            sort,
          }}
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusTab href={`/anime${buildQuery(queryParams, { status: "", page: "" })}`} active={!status}>
          Semua
        </StatusTab>
        {["RELEASING", "FINISHED", "NOT_YET_RELEASED"].map((value) => (
          <StatusTab
            key={value}
            href={`/anime${buildQuery(queryParams, { status: value, page: "" })}`}
            active={status === value}
          >
            {STATUS_LABELS[value]}
          </StatusTab>
        ))}
        <span className="ml-auto font-mono text-[11px] text-muted">
          {result.total.toLocaleString("id-ID")} judul
        </span>
      </div>

      <div className="mt-6">
        {result.items.length > 0 ? (
          <>
            <MediaGrid media={result.items} priorityCount={4} />
            <Pagination
              basePath="/anime"
              page={result.page}
              totalPages={result.totalPages}
              params={queryParams}
            />
          </>
        ) : (
          <EmptyState
            title="Tidak ada judul yang cocok"
            description="Coba hapus beberapa filter, gunakan kata kunci yang lebih pendek, atau mulai dari jadwal musim ini."
            href="/musim/fall-2026"
            linkLabel="Lihat Fall 2026"
          />
        )}
      </div>
    </>
  );
}

function StatusTab({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${
        active
          ? "border-brand/30 bg-brand-soft text-brand"
          : "border-line bg-surface text-muted hover:bg-surface-2 hover:text-ink"
      }`}
    >
      {children}
    </Link>
  );
}

function CatalogSkeleton() {
  return (
    <div className="mt-6">
      <div className="h-[74px] animate-pulse rounded-2xl border border-line bg-surface" />
      <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className="space-y-2">
            <div className="aspect-[2/3] animate-pulse rounded-2xl border border-line bg-surface-2" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-surface-2" />
            <div className="h-2.5 w-3/5 animate-pulse rounded bg-surface-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
