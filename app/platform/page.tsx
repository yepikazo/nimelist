import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { PlatformCard } from "@/components/platform-card";
import { getPlatforms } from "@/lib/repository";

export const metadata: Metadata = {
  title: "Platform Legal untuk Menonton Anime",
  description:
    "Daftar platform legal di Indonesia untuk menonton anime: Bstation, Crunchyroll, Netflix, iQIYI, Vidio, Prime Video, dan Disney+ Hotstar.",
  alternates: { canonical: "/platform" },
};

export default async function PlatformsPage() {
  const platforms = await getPlatforms();

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <Breadcrumbs items={[{ label: "Beranda", href: "/" }, { label: "Platform" }]} />
      <header className="mt-5 border-b border-line pb-6">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-brand">
          Tonton dengan tenang
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em] text-ink sm:text-4xl">
          Platform legal
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Nimelist tidak menyediakan streaming. Halaman ini membantu kamu menemukan
          platform resmi, lalu mencari judulnya di sana.
        </p>
        <div className="mt-4 flex items-start gap-2 rounded-xl border border-success/25 bg-success/5 px-3 py-2 text-[11px] leading-5 text-muted">
          <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
          <p>
            Ketersediaan judul, subtitle, dan harga berbeda per region. Selalu konfirmasi
            di platform resmi.
          </p>
        </div>
      </header>

      <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
        {platforms.map((platform) => (
          <PlatformCard key={platform.slug} platform={platform} />
        ))}
      </div>

      <section className="mt-8 rounded-2xl border border-line bg-surface p-5">
        <h2 className="text-sm font-bold text-ink">Cara memakai tautan platform</h2>
        <p className="mt-1.5 text-xs leading-6 text-muted">
          Tautan di halaman anime membuka halaman pencarian resmi platform, bukan klaim
          bahwa judul tersedia. Jika kamu menemukan tautan yang salah,{" "}
          <Link href="/kontak" className="font-semibold text-brand hover:underline">
            laporkan ke kami
          </Link>
          .
        </p>
        <Link
          href="/anime"
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:underline"
        >
          Mulai dari katalog
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </section>
    </div>
  );
}
