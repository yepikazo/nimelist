import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { EmptyState } from "@/components/empty-state";
import { JsonLd } from "@/components/json-ld";
import { MediaGrid } from "@/components/media-grid";
import { SITE_URL } from "@/lib/constants";
import { getGenreBySlug, getGenres, listMedia } from "@/lib/repository";

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const genres = await getGenres();
  return genres.map((genre) => ({ slug: genre.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const genre = await getGenreBySlug(slug);
  if (!genre) return { title: "Genre tidak ditemukan", robots: { index: false, follow: false } };
  return {
    title: `Anime ${genre.nameId} — Sinopsis & Platform Legal`,
    description: `Rekomendasi anime genre ${genre.nameId} dengan sinopsis bahasa Indonesia, jadwal WIB, dan tautan platform legal. ${genre.count ?? 0} judul di katalog.`,
    alternates: { canonical: `/genre/${genre.slug}` },
    openGraph: {
      title: `Anime ${genre.nameId}`,
      description: genre.description ?? `Katalog anime genre ${genre.nameId}.`,
      url: `${SITE_URL}/genre/${genre.slug}`,
    },
  };
}

export default async function GenrePage({ params }: { params: Params }) {
  const { slug } = await params;
  const [genre, result, genres] = await Promise.all([
    getGenreBySlug(slug),
    listMedia({ genre: slug, sort: "populer", pageSize: 60 }),
    getGenres(),
  ]);
  if (!genre) notFound();

  const relatedGenres = genres
    .filter((item) => item.slug !== genre.slug && (item.count ?? 0) > 0)
    .slice(0, 8);

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Anime ${genre.nameId}`,
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
          { label: "Genre", href: "/genre" },
          { label: genre.nameId },
        ]}
      />
      <header className="mt-5 border-b border-line pb-6">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-brand">
          Genre
        </p>
        <div className="mt-1 flex flex-wrap items-end justify-between gap-3">
          <h1 className="text-3xl font-extrabold tracking-[-0.04em] text-ink sm:text-4xl">
            Anime {genre.nameId}
          </h1>
          <span className="font-mono text-xs text-muted">{result.total} judul</span>
        </div>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">{genre.description}</p>
      </header>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {relatedGenres.map((item) => (
          <Link
            key={item.slug}
            href={`/genre/${item.slug}`}
            className="rounded-full border border-line bg-surface px-3 py-1.5 text-[11px] font-semibold text-muted transition-colors hover:border-brand/40 hover:bg-brand-soft hover:text-brand"
          >
            {item.nameId}
          </Link>
        ))}
      </div>

      <section className="mt-7">
        {result.items.length > 0 ? (
          <MediaGrid media={result.items} priorityCount={4} />
        ) : (
          <EmptyState
            title="Belum ada judul di genre ini"
            description="Coba genre lain atau kembali ke katalog lengkap."
            href="/anime"
            linkLabel="Jelajah katalog"
          />
        )}
      </section>

      <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5">
        <Link
          href="/genre"
          className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-2 text-xs font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Semua genre
        </Link>
        <Link
          href={`/anime?genre=${genre.slug}`}
          className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-2 text-xs font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          Filter di katalog
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <JsonLd data={itemListJsonLd} />
    </div>
  );
}
