import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { EmptyState } from "@/components/empty-state";
import { MediaGrid } from "@/components/media-grid";
import { searchCatalog, searchHitToMedia } from "@/lib/service-clients";

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function single(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.trim() ?? "";
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const query = single((await searchParams).q);
  return {
    title: query ? `Hasil pencarian “${query}”` : "Cari anime",
    description: "Cari anime dari katalog Nimelist berdasarkan judul dan nama alternatif.",
    alternates: { canonical: "/search" },
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = single(params.q).slice(0, 80);
  const cursor = single(params.cursor);
  const validQuery = query.length >= 2;
  const results = validQuery ? await searchCatalog(query, cursor || undefined) : null;
  const media = results?.items.map(searchHitToMedia) ?? [];

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <Breadcrumbs items={[{ label: "Beranda", href: "/" }, { label: "Cari anime" }]} />
      <header className="mt-5 border-b border-line pb-6">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-brand">Pencarian</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em] text-ink sm:text-4xl">Cari anime</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Temukan judul melalui nama Jepang, Inggris, Indonesia, atau ejaan yang mirip.</p>
        <form action="/search" className="mt-5 flex max-w-2xl gap-2">
          <label className="sr-only" htmlFor="anime-query">Judul anime</label>
          <input
            id="anime-query"
            name="q"
            type="search"
            defaultValue={query}
            minLength={2}
            maxLength={80}
            placeholder="Contoh: Sousou no Frieren"
            className="h-11 min-w-0 flex-1 rounded-xl border border-line bg-surface px-3.5 text-sm text-ink outline-none placeholder:text-muted/70 focus:border-brand/50"
          />
          <button type="submit" className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-white transition-colors hover:bg-brand-strong">
            <Search className="h-4 w-4" /> Cari
          </button>
        </form>
      </header>

      <section className="mt-7" aria-live="polite">
        {!validQuery ? (
          <EmptyState title="Masukkan minimal 2 karakter" description="Pencarian akan mencocokkan judul dan ejaan alternatif dari katalog." href="/anime" linkLabel="Jelajah katalog" />
        ) : media.length === 0 ? (
          <EmptyState title="Judul tidak ditemukan" description="Coba ejaan lain atau gunakan nama Jepang, Inggris, maupun Indonesia." href="/anime" linkLabel="Jelajah katalog" />
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between gap-3">
              <p className="text-sm text-muted">Hasil untuk <span className="font-semibold text-ink">“{results?.query}”</span></p>
              <Link href="/anime" className="text-xs font-semibold text-brand hover:underline">Buka katalog</Link>
            </div>
            <MediaGrid media={media} priorityCount={4} />
            {results?.hasMore && results.nextCursor && (
              <div className="mt-8 flex justify-center">
                <Link
                  href={`/search?q=${encodeURIComponent(query)}&cursor=${encodeURIComponent(results.nextCursor)}`}
                  className="inline-flex h-10 items-center rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
                >
                  Muat hasil berikutnya
                </Link>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}
