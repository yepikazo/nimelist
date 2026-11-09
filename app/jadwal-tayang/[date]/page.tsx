import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock3,
  Info,
  MapPin,
} from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { EmptyState } from "@/components/empty-state";
import { JsonLd } from "@/components/json-ld";
import { ScheduleRow } from "@/components/schedule-card";
import { DAY_SHORT_LABELS, SITE_URL } from "@/lib/constants";
import { getScheduleForDate, getTodayDate, getWeekSchedule } from "@/lib/repository";
import {
  addDays,
  formatDateId,
  formatDateShort,
  isValidIsoDate,
  isoDayOfWeek,
  startOfWeek,
  weekDates,
} from "@/lib/utils";

type Params = Promise<{ date: string }>;

export async function generateStaticParams() {
  const today = await getTodayDate();
  return weekDates(today).map((date) => ({ date }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { date } = await params;
  if (!isValidIsoDate(date)) {
    return { title: "Tanggal tidak valid", robots: { index: false, follow: false } };
  }
  const items = await getScheduleForDate(date);
  const readable = formatDateId(date, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return {
    title: `Jadwal Anime ${readable} — WIB`,
    description: `Jadwal tayang anime pada ${readable} dalam WIB, lengkap dengan episode dan platform legal. ${items.length} judul terjadwal.`,
    alternates: { canonical: `/jadwal-tayang/${date}` },
    robots: items.length > 0 ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      title: `Jadwal Anime ${readable}`,
      description: `Jadwal tayang anime dalam WIB untuk ${readable}.`,
      url: `${SITE_URL}/jadwal-tayang/${date}`,
    },
  };
}

export default async function ScheduleDatePage({ params }: { params: Params }) {
  const { date } = await params;
  if (!isValidIsoDate(date)) notFound();
  const today = await getTodayDate();

  const week = weekDates(date);
  const weekData = await getWeekSchedule(week[0]);
  const current = weekData.find((day) => day.date === date);
  const items = current?.items ?? [];
  const isToday = date === today;
  const readable = formatDateId(date, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Jadwal anime ${readable}`,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.media.title,
      url: `${SITE_URL}/anime/${item.media.slug}`,
    })),
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <Breadcrumbs
        items={[
          { label: "Beranda", href: "/" },
          { label: "Jadwal tayang", href: "/jadwal-tayang" },
          { label: readable },
        ]}
      />

      <header className="mt-5 border-b border-line pb-6">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-brand">
          Waktu Indonesia Barat
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-[-0.04em] text-ink sm:text-4xl">
          Jadwal tayang anime
        </h1>
        <p className="mt-2 flex items-center gap-2 text-sm text-muted">
          <CalendarDays className="h-4 w-4 text-brand" />
          {readable}
          {isToday && (
            <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-bold text-success">
              Hari ini
            </span>
          )}
        </p>
      </header>

      <div className="mt-5 grid grid-cols-7 gap-1.5 sm:gap-2" aria-label="Pilih hari">
        {weekData.map((day) => {
          const active = day.date === date;
          const dayNumber = isoDayOfWeek(day.date);
          return (
            <Link
              key={day.date}
              href={`/jadwal-tayang/${day.date}`}
              className={`flex flex-col items-center rounded-xl border px-1 py-2 transition-colors ${
                active
                  ? "border-brand/40 bg-brand text-white shadow-glow"
                  : "border-line bg-surface text-muted hover:bg-surface-2 hover:text-ink"
              }`}
              aria-current={active ? "date" : undefined}
            >
              <span className={`text-[9px] font-semibold uppercase ${active ? "text-white/75" : "text-muted"}`}>
                {DAY_SHORT_LABELS[dayNumber]}
              </span>
              <span className="mt-0.5 font-mono text-sm font-bold">
                {day.date.slice(8, 10)}
              </span>
              <span className={`mt-0.5 font-mono text-[9px] ${active ? "text-white/70" : "text-muted/70"}`}>
                {day.items.length}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-4 flex items-start gap-2.5 rounded-2xl border border-amber/25 bg-amber/5 px-3.5 py-3 text-[11px] leading-5 text-muted">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber" />
        <p>
          Semua jam dalam <strong className="font-semibold text-ink">WIB (UTC+7)</strong>.
          WITA +1 jam, WIT +2 jam. Jadwal bertanda <strong className="font-semibold text-ink">Estimasi</strong>{" "}
          dapat berubah; selalu cek platform resmi.
        </p>
      </div>

      <section className="mt-6" aria-label={`Jadwal ${readable}`}>
        {items.length > 0 ? (
          <div className="rounded-2xl border border-line bg-surface px-4 sm:px-5">
            {items.map((item) => (
              <ScheduleRow key={`${item.media.slug}-${item.id}`} item={item} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="Tidak ada jadwal di tanggal ini"
            description="Mungkin tidak ada judul yang tayang, atau jadwalnya belum diperbarui. Coba hari lain atau lihat katalog musim ini."
            href="/musim/fall-2026"
            linkLabel="Lihat Fall 2026"
          />
        )}
      </section>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Link
          href={`/jadwal-tayang/${addDays(startOfWeek(date), -7)}`}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-line bg-surface px-3 text-xs font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Minggu sebelumnya
        </Link>
        <span className="hidden items-center gap-1.5 text-[10px] text-muted sm:flex">
          <MapPin className="h-3 w-3" />
          Jakarta · {formatDateShort(date)}
        </span>
        <Link
          href={`/jadwal-tayang/${addDays(startOfWeek(date), 7)}`}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-line bg-surface px-3 text-xs font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-ink"
        >
          Minggu berikutnya
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <p className="mt-5 flex items-center gap-1.5 text-[10px] text-muted">
        <Clock3 className="h-3 w-3" />
        Diperbarui untuk zona WIB. Jadwal Fall 2026 pada versi beta masih estimasi.
      </p>

      <JsonLd data={itemListJsonLd} />
    </div>
  );
}
