import type { Metadata } from "next";
import Link from "next/link";
import { Building2, ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getStudios } from "@/lib/repository";

export const metadata: Metadata = {
  title: "Studio Anime — Jelajah Berdasarkan Studio",
  description:
    "Telusuri anime berdasarkan studio produksi: MAPPA, Madhouse, ufotable, Kyoto Animation, dan lainnya.",
  alternates: { canonical: "/studio" },
};

export default async function StudiosPage() {
  const studios = await getStudios();
  const visible = studios.filter((studio) => (studio.count ?? 0) > 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <Breadcrumbs items={[{ label: "Beranda", href: "/" }, { label: "Studio" }]} />
      <header className="mt-5 border-b border-line pb-6">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-brand">
          Di balik layar
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em] text-ink sm:text-4xl">
          Studio anime
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Temukan judul berdasarkan studio yang mengerjakannya. Data studio diambil dari
          metadata katalog dan dinormalisasi agar konsisten.
        </p>
      </header>

      <div className="mt-6 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((studio) => (
          <Link
            key={studio.slug}
            href={`/studio/${studio.slug}`}
            className="group flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-card"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                <Building2 className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-sm font-bold text-ink group-hover:text-brand">
                  {studio.name}
                </span>
                <span className="mt-0.5 block font-mono text-[10px] text-muted">
                  {studio.count} judul
                </span>
              </span>
            </span>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
          </Link>
        ))}
      </div>
    </div>
  );
}
