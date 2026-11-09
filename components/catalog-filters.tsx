import Link from "next/link";
import { Filter, RotateCcw, Search } from "lucide-react";
import type { CatalogFacets } from "@/lib/types";
import { SORT_OPTIONS } from "@/lib/constants";
import { seasonSlug } from "@/lib/utils";

const STATUS_OPTIONS = [
  { value: "", label: "Semua status" },
  { value: "RELEASING", label: "Sedang tayang" },
  { value: "FINISHED", label: "Selesai" },
  { value: "NOT_YET_RELEASED", label: "Akan datang" },
];

const FORMAT_OPTIONS = [
  { value: "", label: "Semua format" },
  { value: "TV", label: "TV" },
  { value: "MOVIE", label: "Film" },
  { value: "ONA", label: "ONA" },
  { value: "OVA", label: "OVA" },
  { value: "SPECIAL", label: "Spesial" },
];

const fieldClass =
  "h-10 w-full rounded-xl border border-line bg-surface px-3 text-sm text-ink outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/15";

export function CatalogFilters({
  facets,
  values,
}: {
  facets: CatalogFacets;
  values: {
    q?: string;
    genre?: string;
    season?: string;
    status?: string;
    format?: string;
    platform?: string;
    sort?: string;
  };
}) {
  return (
    <form
      action="/anime"
      method="get"
      className="rounded-2xl border border-line bg-surface/70 p-3 sm:p-4"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Cari anime</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            name="q"
            defaultValue={values.q ?? ""}
            placeholder="Cari judul, sinonim, genre, atau studio…"
            className={`${fieldClass} pl-9`}
          />
        </label>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:items-center lg:gap-2">
          <span className="hidden items-center gap-1.5 text-[11px] font-semibold text-muted lg:inline-flex">
            <Filter className="h-3.5 w-3.5" />
            Filter
          </span>
          <select name="genre" defaultValue={values.genre ?? ""} className={`${fieldClass} min-w-0 lg:min-w-[130px]`} aria-label="Genre">
            <option value="">Semua genre</option>
            {facets.genres
              .filter((genre) => (genre.count ?? 0) > 0)
              .map((genre) => (
                <option key={genre.slug} value={genre.slug}>
                  {genre.nameId}
                </option>
              ))}
          </select>
          <select
            name="season"
            defaultValue={values.season ?? ""}
            className={`${fieldClass} min-w-0 lg:min-w-[140px]`}
            aria-label="Musim"
          >
            <option value="">Semua musim</option>
            {facets.seasons.map((item) => (
              <option key={`${item.season}-${item.year}`} value={seasonSlug(item.season, item.year)}>
                {item.season.charAt(0) + item.season.slice(1).toLowerCase()} {item.year}
              </option>
            ))}
          </select>
          <select name="status" defaultValue={values.status ?? ""} className={`${fieldClass} min-w-0 lg:min-w-[140px]`} aria-label="Status">
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select name="format" defaultValue={values.format ?? ""} className={`${fieldClass} min-w-0 lg:min-w-[130px]`} aria-label="Format">
            {FORMAT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select name="platform" defaultValue={values.platform ?? ""} className={`${fieldClass} min-w-0 lg:min-w-[150px]`} aria-label="Platform">
            <option value="">Semua platform</option>
            {facets.platforms.map((platform) => (
              <option key={platform.slug} value={platform.slug}>
                {platform.name}
              </option>
            ))}
          </select>
          <select name="sort" defaultValue={values.sort ?? "populer"} className={`${fieldClass} min-w-0 lg:min-w-[150px]`} aria-label="Urutkan">
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-xl bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-strong"
          >
            Terapkan
          </button>
          <Link
            href="/anime"
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-ink"
            aria-label="Reset filter"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </Link>
        </div>
      </div>
    </form>
  );
}
