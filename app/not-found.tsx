import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CalendarDays, Compass, Search } from "lucide-react";

export const metadata: Metadata = {
  title: "Halaman tidak ditemukan",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <p className="font-mono text-6xl font-extrabold tracking-tighter text-brand/30">404</p>
      <h1 className="mt-3 text-2xl font-extrabold tracking-[-0.03em] text-ink sm:text-3xl">
        Halaman ini tidak ada
      </h1>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted">
        Tautan mungkin sudah berubah, atau judul yang kamu cari belum ada di katalog.
        Coba cari dari katalog atau mulai dari jadwal hari ini.
      </p>

      <form
        action="/anime"
        method="get"
        className="mt-6 flex w-full max-w-md items-center gap-2 rounded-2xl border border-line bg-surface p-1.5"
      >
        <Search className="ml-2 h-4 w-4 shrink-0 text-muted" />
        <input
          type="search"
          name="q"
          placeholder="Cari judul anime…"
          className="h-9 min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-muted focus:outline-none"
          aria-label="Cari anime"
        />
        <button
          type="submit"
          className="h-9 shrink-0 rounded-xl bg-brand px-3 text-xs font-bold text-white transition-colors hover:bg-brand-strong"
        >
          Cari
        </button>
      </form>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Link
          href="/"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Beranda
        </Link>
        <Link
          href="/anime"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
        >
          <Compass className="h-4 w-4 text-brand" />
          Jelajah
        </Link>
        <Link
          href="/jadwal-tayang"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
        >
          <CalendarDays className="h-4 w-4 text-brand" />
          Jadwal
        </Link>
      </div>
    </div>
  );
}
