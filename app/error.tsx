"use client";

import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-2xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-danger/10 text-danger">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <h1 className="mt-4 text-2xl font-extrabold tracking-[-0.03em] text-ink sm:text-3xl">
        Ada yang tidak beres
      </h1>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted">
        Halaman gagal dimuat. Coba muat ulang, atau kembali ke beranda. Jika masalah
        berlanjut, kirim laporan melalui halaman kontak.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-[10px] text-muted/70">Kode: {error.digest}</p>
      )}
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-white transition-colors hover:bg-brand-strong"
        >
          <RotateCcw className="h-4 w-4" />
          Coba lagi
        </button>
        <Link
          href="/"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
        >
          <Home className="h-4 w-4" />
          Beranda
        </Link>
      </div>
    </div>
  );
}
