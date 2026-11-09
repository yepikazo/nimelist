import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, ExternalLink, ShieldCheck } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { EmptyState } from "@/components/empty-state";
import { JsonLd } from "@/components/json-ld";
import { MediaGrid } from "@/components/media-grid";
import { SITE_URL } from "@/lib/constants";
import { getPlatformBySlug, getPlatforms, listMedia } from "@/lib/repository";
import { getInitials } from "@/lib/utils";

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const platforms = await getPlatforms();
  return platforms.map((platform) => ({ slug: platform.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const platform = await getPlatformBySlug(slug);
  if (!platform) {
    return { title: "Platform tidak ditemukan", robots: { index: false, follow: false } };
  }
  return {
    title: `Anime di ${platform.name} — Daftar & Jadwal`,
    description: `${platform.description} Lihat judul yang ditautkan ke pencarian ${platform.name} di Nimelist.`,
    alternates: { canonical: `/platform/${platform.slug}` },
    openGraph: {
      title: `Anime di ${platform.name}`,
      description: platform.description,
      url: `${SITE_URL}/platform/${platform.slug}`,
    },
  };
}

export default async function PlatformPage({ params }: { params: Params }) {
  const { slug } = await params;
  const [platform, result, platforms] = await Promise.all([
    getPlatformBySlug(slug),
    listMedia({ platform: slug, sort: "populer", pageSize: 60 }),
    getPlatforms(),
  ]);
  if (!platform) notFound();

  const otherPlatforms = platforms.filter((item) => item.slug !== platform.slug);
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Anime di ${platform.name}`,
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
          { label: "Platform", href: "/platform" },
          { label: platform.name },
        ]}
      />

      <section className="mt-5 overflow-hidden rounded-3xl border border-line bg-surface p-6 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span
              className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-lg font-extrabold text-white"
              style={{ backgroundColor: platform.color }}
            >
              {getInitials(platform.name)}
            </span>
            <div>
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-brand">
                Platform legal
              </p>
              <h1 className="mt-0.5 text-3xl font-extrabold tracking-[-0.04em] text-ink">
                {platform.name}
              </h1>
              <p className="mt-1 max-w-xl text-sm leading-6 text-muted">
                {platform.description}
              </p>
            </div>
          </div>
          <a
            href={platform.websiteUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex h-10 shrink-0 items-center gap-2 self-start rounded-xl border border-line bg-canvas px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-2 sm:self-auto"
          >
            Buka situs resmi
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
        <div className="mt-5 flex items-start gap-2 rounded-xl border border-success/25 bg-success/5 px-3 py-2 text-[11px] leading-5 text-muted">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
          <p>
            Daftar di bawah adalah judul yang ditautkan ke pencarian {platform.name}, bukan
            jaminan ketersediaan. Konfirmasi langsung di platform.
          </p>
        </div>
      </section>

      <div className="mt-5 flex flex-wrap gap-1.5">
        {otherPlatforms.map((item) => (
          <Link
            key={item.slug}
            href={`/platform/${item.slug}`}
            className="rounded-full border border-line bg-surface px-3 py-1.5 text-[11px] font-semibold text-muted transition-colors hover:border-brand/40 hover:bg-brand-soft hover:text-brand"
          >
            {item.name}
          </Link>
        ))}
      </div>

      <section className="mt-7">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="text-xl font-bold tracking-[-0.025em] text-ink">
            Judul yang ditautkan
          </h2>
          <span className="font-mono text-[11px] text-muted">{result.total} judul</span>
        </div>
        {result.items.length > 0 ? (
          <MediaGrid media={result.items} priorityCount={4} />
        ) : (
          <EmptyState
            title="Belum ada judul"
            description="Platform ini belum memiliki tautan judul di katalog."
            href="/anime"
            linkLabel="Jelajah katalog"
          />
        )}
      </section>

      <div className="mt-8 border-t border-line pt-5">
        <Link
          href="/platform"
          className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-2 text-xs font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Semua platform
        </Link>
        <Link
          href={`/anime?platform=${platform.slug}`}
          className="ml-2 inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3 py-2 text-xs font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          Filter di katalog
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <JsonLd data={itemListJsonLd} />
    </div>
  );
}
