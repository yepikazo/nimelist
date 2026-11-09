import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { EmptyState } from "@/components/empty-state";
import { JsonLd } from "@/components/json-ld";
import { MediaGrid } from "@/components/media-grid";
import { SITE_URL } from "@/lib/constants";
import { getStudioBySlug, getStudios, listMedia } from "@/lib/repository";

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const studios = await getStudios();
  return studios.map((studio) => ({ slug: studio.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const studio = await getStudioBySlug(slug);
  if (!studio) {
    return { title: "Studio tidak ditemukan", robots: { index: false, follow: false } };
  }
  return {
    title: `Anime Studio ${studio.name} — Katalog & Jadwal`,
    description: `Daftar anime yang diproduksi ${studio.name}, lengkap dengan genre, jadwal WIB, dan tautan platform legal. ${studio.count ?? 0} judul di Nimelist.`,
    alternates: { canonical: `/studio/${studio.slug}` },
    openGraph: {
      title: `Anime Studio ${studio.name}`,
      description: `Katalog anime dari studio ${studio.name}.`,
      url: `${SITE_URL}/studio/${studio.slug}`,
    },
  };
}

export default async function StudioPage({ params }: { params: Params }) {
  const { slug } = await params;
  const [studio, result, studios] = await Promise.all([
    getStudioBySlug(slug),
    listMedia({ studio: slug, sort: "populer", pageSize: 60 }),
    getStudios(),
  ]);
  if (!studio) notFound();

  const related = studios
    .filter((item) => item.slug !== studio.slug && (item.count ?? 0) > 0)
    .slice(0, 8);

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Anime Studio ${studio.name}`,
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
          { label: "Studio", href: "/studio" },
          { label: studio.name },
        ]}
      />

      <header className="mt-5 border-b border-line pb-6">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-soft text-brand">
            <Building2 className="h-5 w-5" />
          </span>
          <div>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-brand">
              Studio
            </p>
            <h1 className="text-3xl font-extrabold tracking-[-0.04em] text-ink sm:text-4xl">
              {studio.name}
            </h1>
          </div>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
          {result.total} judul dalam katalog Nimelist. Urutan menampilkan judul yang paling
          relevan terlebih dahulu.
        </p>
      </header>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {related.map((item) => (
          <Link
            key={item.slug}
            href={`/studio/${item.slug}`}
            className="rounded-full border border-line bg-surface px-3 py-1.5 text-[11px] font-semibold text-muted transition-colors hover:border-brand/40 hover:bg-brand-soft hover:text-brand"
          >
            {item.name}
          </Link>
        ))}
      </div>

      <section className="mt-7">
        {result.items.length > 0 ? (
          <MediaGrid media={result.items} priorityCount={4} />
        ) : (
          <EmptyState
            title="Belum ada judul dari studio ini"
            description="Coba studio lain atau kembali ke katalog lengkap."
            href="/anime"
            linkLabel="Jelajah katalog"
          />
        )}
      </section>

      <div className="mt-8 border-t border-line pt-5">
        <Link
          href="/studio"
          className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-2 text-xs font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Semua studio
        </Link>
      </div>

      <JsonLd data={itemListJsonLd} />
    </div>
  );
}
