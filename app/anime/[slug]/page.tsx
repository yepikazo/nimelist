/* eslint-disable @next/next/no-img-element */
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Film,
  Info,
  Languages,
  Play,
  ShieldCheck,
  Star,
  Tv,
} from "lucide-react";
import { Breadcrumbs } from "@/components/breadcrumbs";
import {
  EstimateBadge,
  FormatBadge,
  Pill,
  ReviewedBadge,
  ScoreBadge,
  StatusBadge,
} from "@/components/badges";
import { EmptyState } from "@/components/empty-state";
import { JsonLd } from "@/components/json-ld";
import { MediaGrid } from "@/components/media-grid";
import { SectionHeading } from "@/components/section-heading";
import { ShareButton } from "@/components/share-button";
import { SITE_URL } from "@/lib/constants";
import {
  getAllMediaSlugs,
  getMediaBySlug,
  getRelatedMedia,
  getTodayDate,
} from "@/lib/repository";
import {
  coverFallback,
  formatDateWeekday,
  formatDuration,
  formatEpisode,
  formatRelativeDay,
  formatSeasonLong,
  formatTimeWib,
  getInitials,
  seasonLabel,
  truncate,
} from "@/lib/utils";

type Params = Promise<{ slug: string }>;

export async function generateStaticParams() {
  const slugs = await getAllMediaSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const media = await getMediaBySlug(slug);
  if (!media) {
    return { title: "Anime tidak ditemukan", robots: { index: false, follow: false } };
  }

  const description = media.synopsisId
    ? truncate(media.synopsisId.replace(/\s+/g, " "), 158)
    : truncate(
        `Informasi ${media.title}: jadwal tayang WIB, genre, studio, dan tautan platform legal. Sinopsis bahasa Indonesia belum tersedia.`,
        158,
      );
  const indexable = media.contentStatus === "REVIEWED" && !media.isAdult;

  return {
    title: `${media.title} — Sinopsis, Jadwal, Platform Legal`,
    description,
    alternates: { canonical: `/anime/${media.slug}` },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      type: "article",
      title: media.title,
      description,
      url: `${SITE_URL}/anime/${media.slug}`,
      images: media.coverUrl ? [{ url: media.coverUrl, alt: `Poster ${media.title}` }] : undefined,
    },
  };
}

export default async function AnimeDetailPage({ params }: { params: Params }) {
  const { slug } = await params;
  const media = await getMediaBySlug(slug);
  if (!media) notFound();
  const today = await getTodayDate();

  const related = await getRelatedMedia(
    media.id,
    media.genres.map((genre) => genre.slug),
    6,
  );
  const nextSchedule = media.scheduleSlots.slice(0, 3);
  const altTitles = [media.titleRomaji, media.titleEnglish, ...media.synonyms]
    .filter((value): value is string => Boolean(value))
    .filter((value, index, array) => array.indexOf(value) === index && value !== media.title)
    .slice(0, 4);

  const schemaType = media.format === "MOVIE" ? "Movie" : "TVSeries";
  const mediaJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": schemaType,
    "@id": `${SITE_URL}/anime/${media.slug}#anime`,
    name: media.title,
    alternateName: altTitles.length > 0 ? altTitles : undefined,
    url: `${SITE_URL}/anime/${media.slug}`,
    image: media.coverUrl ?? undefined,
    description: media.synopsisId ?? undefined,
    genre: media.genres.map((genre) => genre.nameId),
    inLanguage: "ja",
    countryOfOrigin: "JP",
    numberOfEpisodes: media.format === "MOVIE" ? undefined : media.episodes ?? undefined,
    productionCompany: media.studios.length
      ? media.studios.map((studio) => ({ "@type": "Organization", name: studio.name }))
      : undefined,
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Beranda", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Jelajah anime", item: `${SITE_URL}/anime` },
      {
        "@type": "ListItem",
        position: 3,
        name: media.title,
        item: `${SITE_URL}/anime/${media.slug}`,
      },
    ],
  };

  return (
    <>
      <section className="relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-brand/15 via-transparent to-amber/10" />
        {media.coverUrl && (
          <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-25">
            <img
              src={media.coverUrl}
              alt=""
              aria-hidden="true"
              className="h-full w-full scale-110 object-cover blur-2xl"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <Breadcrumbs
            items={[
              { label: "Beranda", href: "/" },
              { label: "Jelajah", href: "/anime" },
              { label: media.title },
            ]}
          />
          <div className="mt-6 grid gap-6 sm:grid-cols-[180px_1fr] lg:grid-cols-[220px_1fr] lg:gap-10">
            <div className="relative mx-auto w-full max-w-[220px] sm:mx-0">
              <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/10 bg-surface-2 shadow-card">
                {media.coverUrl ? (
                  <img
                    src={media.coverUrl}
                    alt={`Poster ${media.title}`}
                    loading="eager"
                    fetchPriority="high"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="poster-fallback flex h-full items-center justify-center font-mono text-3xl font-bold text-white/80">
                    {coverFallback(media.title)}
                  </span>
                )}
                <div className="absolute left-2 top-2">
                  <FormatBadge format={media.format} />
                </div>
                {typeof media.scoreAvg === "number" && (
                  <div className="absolute right-2 top-2">
                    <ScoreBadge score={media.scoreAvg} />
                  </div>
                )}
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={media.status} />
                {media.contentStatus === "REVIEWED" ? <ReviewedBadge /> : <Pill>Belum ditinjau</Pill>}
                {media.isAdult && <Pill className="border-danger/30 bg-danger/10 text-danger">18+</Pill>}
              </div>
              <h1 className="mt-3 text-balance text-3xl font-extrabold leading-tight tracking-[-0.04em] text-ink sm:text-4xl lg:text-5xl">
                {media.title}
              </h1>
              {altTitles.length > 0 && (
                <p className="mt-2 line-clamp-2 text-sm text-muted">
                  {altTitles.join(" · ")}
                </p>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted">
                {typeof media.scoreAvg === "number" ? (
                  <span className="inline-flex items-center gap-1.5 font-mono font-semibold text-amber">
                    <Star className="h-3.5 w-3.5 fill-current" />
                    {media.scoreAvg.toFixed(1).replace(".", ",")} / 10
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <Star className="h-3.5 w-3.5" />
                    Skor belum tersedia
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Tv className="h-3.5 w-3.5" />
                  {formatEpisode(media.episodes)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {seasonLabel(media.season, media.seasonYear)}
                </span>
                {media.durationMinutes && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock3 className="h-3.5 w-3.5" />
                    {formatDuration(media.durationMinutes)}
                  </span>
                )}
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {media.genres.map((genre) => (
                  <Link
                    key={genre.slug}
                    href={`/genre/${genre.slug}`}
                    className="rounded-full border border-line bg-surface/80 px-2.5 py-1 text-[11px] font-semibold text-muted transition-colors hover:border-brand/40 hover:bg-brand-soft hover:text-brand"
                  >
                    {genre.nameId}
                  </Link>
                ))}
              </div>

              {media.studios.length > 0 && (
                <p className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-muted">
                  <Building2 className="h-3.5 w-3.5" />
                  Studio:
                  {media.studios.map((studio, index) => (
                    <span key={studio.slug}>
                      <Link
                        href={`/studio/${studio.slug}`}
                        className="font-semibold text-ink hover:text-brand"
                      >
                        {studio.name}
                      </Link>
                      {index < media.studios.length - 1 ? "," : ""}
                    </span>
                  ))}
                </p>
              )}

              <div className="mt-6 flex flex-wrap gap-2.5">
                <Link
                  href="#platform"
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-white transition-colors hover:bg-brand-strong"
                >
                  <Play className="h-4 w-4" />
                  Cek platform
                </Link>
                {nextSchedule.length > 0 && (
                  <Link
                    href={`/jadwal-tayang/${nextSchedule[0].date}`}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
                  >
                    <CalendarDays className="h-4 w-4 text-brand" />
                    Jadwal
                  </Link>
                )}
                <ShareButton title={media.title} />
              </div>

              <div className="mt-5 flex items-start gap-2 rounded-xl border border-line bg-surface/70 px-3 py-2.5 text-[11px] leading-5 text-muted">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                <p>
                  Nimelist tidak menyediakan streaming. Tautan platform di bawah membuka
                  pencarian resmi; ketersediaan judul dan subtitle berbeda per region.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 py-10 lg:grid-cols-[1fr_320px] lg:gap-14">
          <div className="min-w-0">
            <section id="platform" className="scroll-mt-24">
              <SectionHeading
                eyebrow="Langkah pertama"
                title="Tonton di platform legal"
                description="Kami hanya menautkan platform resmi. Tautan membuka halaman pencarian judul."
              />
              {media.streaming.length > 0 ? (
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {media.streaming.map((link) => (
                    <a
                      key={`${link.platform.slug}-${link.url}`}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="group flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-card"
                    >
                      <span
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs font-extrabold text-white"
                        style={{ backgroundColor: link.platform.color }}
                      >
                        {getInitials(link.platform.name)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5 text-sm font-bold text-ink">
                          Cek di {link.platform.name}
                          <ExternalLink className="h-3.5 w-3.5 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        </span>
                        <span className="mt-0.5 block truncate text-[10px] text-muted">
                          {link.note ?? link.platform.description}
                        </span>
                      </span>
                    </a>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Platform belum tersedia"
                  description="Belum ada tautan platform untuk judul ini. Kami akan menambahkannya setelah diverifikasi."
                  href="/platform"
                  linkLabel="Lihat platform legal"
                />
              )}
            </section>

            <section className="mt-12">
              <SectionHeading
                eyebrow="Sinopsis"
                title="Tentang anime ini"
                description={
                  media.contentStatus === "REVIEWED"
                    ? "Ditulis ulang dalam bahasa Indonesia dan ditinjau sebelum terbit."
                    : "Sinopsis bahasa Indonesia belum tersedia untuk judul ini."
                }
              />
              {media.synopsisId ? (
                <div className="rounded-2xl border border-line bg-surface p-5">
                  <ReviewedBadge />
                  <div className="mt-3 space-y-3 text-sm leading-7 text-muted">
                    {media.synopsisId.split(/\n\n+/).map((paragraph, index) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                  <p className="mt-4 flex items-center gap-1.5 text-[10px] text-muted/80">
                    <CheckCircle2 className="h-3 w-3 text-success" />
                    Ditinjau editor Nimelist · Diperbarui 9 Nov 2026
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl border border-amber/25 bg-amber/5 p-5">
                  <div className="flex items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber/15 text-amber">
                      <Info className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-ink">Sinopsis sedang disiapkan</h3>
                      <p className="mt-1 text-xs leading-6 text-muted">
                        Kami tidak menerbitkan terjemahan mesin dari sinopsis berhak cipta.
                        Halaman ini menampilkan metadata katalog dan tidak diindeks mesin
                        pencari sampai sinopsis ditinjau.
                      </p>
                      <Link
                        href="/tentang"
                        className="mt-2 inline-flex text-xs font-semibold text-brand hover:underline"
                      >
                        Pelajari kebijakan editorial →
                      </Link>
                    </div>
                  </div>
                </div>
              )}
            </section>

            <section className="mt-12">
              <SectionHeading
                eyebrow="Waktu Indonesia Barat"
                title="Jadwal tayang"
                description="Jadwal Fall 2026 masih estimasi. Selalu cek platform untuk perubahan."
              />
              {nextSchedule.length > 0 ? (
                <div className="overflow-hidden rounded-2xl border border-line bg-surface">
                  {nextSchedule.map((slot, index) => (
                    <Link
                      key={`${slot.date}-${slot.id}`}
                      href={`/jadwal-tayang/${slot.date}`}
                      className={`flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-surface-2 ${
                        index > 0 ? "border-t border-line" : ""
                      }`}
                    >
                      <span className="w-20 shrink-0">
                        <span className="block font-mono text-sm font-bold text-ink">
                          {formatTimeWib(slot.timeWib)}
                        </span>
                        <span className="mt-0.5 block text-[10px] text-muted">
                          {formatRelativeDay(slot.date, today)}
                        </span>
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-ink">
                          Episode {slot.episodeNumber}
                          {slot.episodes ? ` dari ${slot.episodes}` : ""}
                        </span>
                        <span className="mt-0.5 block text-[10px] text-muted">
                          {formatDateWeekday(slot.date)}
                        </span>
                      </span>
                      {slot.confidence === "ESTIMATED" && <EstimateBadge />}
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-line bg-surface/50 p-5 text-sm text-muted">
                  Belum ada jadwal tayang untuk judul ini. Jika ini anime musim ini, jadwal
                  akan ditambahkan setelah dikonfirmasi.
                </div>
              )}
            </section>

            <section className="mt-12">
              <SectionHeading eyebrow="Metadata" title="Informasi" />
              <dl className="grid gap-x-8 gap-y-3 rounded-2xl border border-line bg-surface p-5 sm:grid-cols-2">
                <InfoRow label="Judul romaji" value={media.titleRomaji} />
                <InfoRow label="Judul Inggris" value={media.titleEnglish ?? "—"} />
                <InfoRow label="Sinonim" value={media.synonyms.slice(0, 5).join(", ") || "—"} />
                <InfoRow label="Format" value={media.format} />
                <InfoRow label="Status" value={media.status.replaceAll("_", " ")} />
                <InfoRow
                  label="Musim"
                  value={`${formatSeasonLong(media.season)} ${media.seasonYear ?? ""}`.trim()}
                />
                <InfoRow label="Episode" value={media.episodes ? String(media.episodes) : "TBA"} />
                <InfoRow
                  label="Durasi"
                  value={media.durationMinutes ? formatDuration(media.durationMinutes) : "TBA"}
                />
                <InfoRow
                  label="Studio"
                  value={media.studios.map((studio) => studio.name).join(", ") || "—"}
                />
                <InfoRow label="Sumber data" value={media.source} />
              </dl>
              {media.sourceUrl && (
                <p className="mt-3 flex items-center gap-1.5 text-[11px] text-muted">
                  <Languages className="h-3.5 w-3.5" />
                  Sumber eksternal:
                  <a
                    href={media.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-brand hover:underline"
                  >
                    lihat data asal
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <div className="rounded-2xl border border-line bg-surface p-4">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                Ringkasan cepat
              </p>
              <div className="mt-3 space-y-2.5 text-xs">
                <SummaryRow icon={Tv} label="Format" value={media.format} />
                <SummaryRow
                  icon={CalendarDays}
                  label="Musim"
                  value={seasonLabel(media.season, media.seasonYear)}
                />
                <SummaryRow
                  icon={Clock3}
                  label="Episode"
                  value={formatEpisode(media.episodes)}
                />
                <SummaryRow
                  icon={Film}
                  label="Durasi"
                  value={media.durationMinutes ? formatDuration(media.durationMinutes) : "TBA"}
                />
                <SummaryRow
                  icon={Star}
                  label="Skor"
                  value={
                    typeof media.scoreAvg === "number"
                      ? `${media.scoreAvg.toFixed(1).replace(".", ",")} / 10`
                      : "Belum tersedia"
                  }
                />
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-4">
              <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                Platform
              </p>
              <div className="mt-3 space-y-2">
                {media.platforms.map((platform) => (
                  <Link
                    key={platform.slug}
                    href={`/platform/${platform.slug}`}
                    className="flex items-center gap-2 rounded-lg px-1 py-1 text-xs text-muted transition-colors hover:text-ink"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: platform.color }}
                    />
                    {platform.name}
                  </Link>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {related.length > 0 && (
          <section className="border-t border-line py-10">
            <SectionHeading
              eyebrow="Lanjut menonton"
              title="Anime terkait"
              description="Judul lain dengan genre yang mirip."
              href={`/genre/${media.genres[0]?.slug ?? "aksi"}`}
              linkLabel={`Semua ${media.genres[0]?.nameId ?? "genre"}`}
            />
            <MediaGrid media={related} />
          </section>
        )}
      </div>

      <JsonLd data={[mediaJsonLd, breadcrumbJsonLd]} />
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</dt>
      <dd className="mt-0.5 text-xs leading-6 text-ink">{value}</dd>
    </div>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Tv;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="inline-flex items-center gap-1.5 text-muted">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className="text-right font-medium text-ink">{value}</span>
    </div>
  );
}
