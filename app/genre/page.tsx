import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getGenres } from "@/lib/repository";

export const metadata: Metadata = {
  title: "Genre Anime — Jelajah Berdasarkan Selera",
  description:
    "Daftar genre anime di Nimelist: aksi, petualangan, fantasi, romansa, isekai, slice of life, dan lainnya.",
  alternates: { canonical: "/genre" },
};

export default async function GenresPage() {
  const genres = await getGenres();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <Breadcrumbs items={[{ label: "Beranda", href: "/" }, { label: "Genre" }]} />
      <header className="mt-5 border-b border-line pb-6">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-brand">
          Berdasarkan selera
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em] text-ink sm:text-4xl">
          Genre anime
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Temukan judul sesuai mood. Setiap halaman genre berisi katalog, jadwal, dan
          tautan platform legal.
        </p>
      </header>

      <div className="mt-6 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {genres
          .filter((genre) => (genre.count ?? 0) > 0)
          .map((genre) => (
            <Link
              key={genre.slug}
              href={`/genre/${genre.slug}`}
              className="group flex items-start justify-between gap-3 rounded-2xl border border-line bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-card"
            >
              <span className="min-w-0">
                <span className="flex items-center gap-2 text-sm font-bold text-ink group-hover:text-brand">
                  {genre.nameId}
                  <span className="font-mono text-[10px] font-medium text-muted">
                    {genre.count}
                  </span>
                </span>
                <span className="mt-1 block text-[11px] leading-5 text-muted">
                  {genre.description}
                </span>
              </span>
              <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
            </Link>
          ))}
      </div>
    </div>
  );
}
