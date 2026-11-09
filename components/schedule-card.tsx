/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Clock3, Play } from "lucide-react";
import { EstimateBadge } from "@/components/badges";
import type { ScheduleItem } from "@/lib/types";
import { cn, coverFallback, formatScore, formatTimeWib } from "@/lib/utils";

export function ScheduleCard({ item, className }: { item: ScheduleItem; className?: string }) {
  const { media } = item;
  return (
    <article
      className={cn(
        "group relative flex w-[260px] shrink-0 gap-3 rounded-2xl border border-line bg-surface p-3 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-card",
        className,
      )}
    >
      <Link
        href={`/anime/${media.slug}`}
        className="relative block h-[96px] w-16 shrink-0 overflow-hidden rounded-xl bg-surface-2"
        aria-label={`Buka ${media.title}`}
      >
        {media.coverUrl ? (
          <img
            src={media.coverUrl}
            alt={`Poster ${media.title}`}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="poster-fallback flex h-full items-center justify-center font-mono text-xs font-bold text-white/80">
            {coverFallback(media.title)}
          </span>
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 font-mono text-[12px] font-bold text-brand">
            <Clock3 className="h-3 w-3" />
            {formatTimeWib(item.timeWib)}
          </span>
          {item.confidence === "ESTIMATED" && <EstimateBadge className="px-1.5 text-[9px]" />}
        </div>
        <Link href={`/anime/${media.slug}`} className="mt-1.5 block">
          <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-ink transition-colors group-hover:text-brand">
            {media.title}
          </h3>
        </Link>
        <p className="mt-1 font-mono text-[10px] text-muted">
          Episode {item.episodeNumber}
          {media.episodes ? ` / ${media.episodes}` : ""}
        </p>
        <div className="mt-2 flex items-center gap-1.5">
          {media.platforms.slice(0, 2).map((platform) => (
            <span
              key={platform.slug}
              className="inline-flex items-center gap-1 text-[9px] font-medium text-muted"
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: platform.color }}
              />
              {platform.name}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

export function ScheduleRow({ item }: { item: ScheduleItem }) {
  const { media } = item;
  return (
    <article className="group flex gap-3 border-b border-line py-4 last:border-0 sm:gap-5">
      <div className="w-14 shrink-0 pt-0.5 text-right sm:w-16">
        <p className="font-mono text-sm font-bold text-ink">
          {formatTimeWib(item.timeWib).replace(" WIB", "")}
        </p>
        <p className="mt-0.5 font-mono text-[10px] text-muted">WIB</p>
      </div>

      <Link
        href={`/anime/${media.slug}`}
        className="relative block h-[88px] w-14 shrink-0 overflow-hidden rounded-xl border border-line bg-surface-2 sm:h-[104px] sm:w-[70px]"
        aria-label={`Buka ${media.title}`}
      >
        {media.coverUrl ? (
          <img
            src={media.coverUrl}
            alt={`Poster ${media.title}`}
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <span className="poster-fallback flex h-full items-center justify-center font-mono text-xs font-bold text-white/80">
            {coverFallback(media.title)}
          </span>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Link href={`/anime/${media.slug}`}>
            <h3 className="text-[15px] font-bold leading-snug text-ink transition-colors group-hover:text-brand">
              {media.title}
            </h3>
          </Link>
          {item.confidence === "ESTIMATED" && <EstimateBadge />}
          {typeof media.scoreAvg === "number" && (
            <span className="font-mono text-[11px] font-semibold text-amber">
              ★ {formatScore(media.scoreAvg)}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs text-muted">
          Episode {item.episodeNumber}
          {media.episodes ? ` dari ${media.episodes}` : ""} ·{" "}
          {media.genres.slice(0, 2).map((genre) => genre.nameId).join(", ")}
        </p>
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          {media.platforms.slice(0, 3).map((platform) => (
            <span
              key={platform.slug}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2 py-1 text-[10px] font-medium text-muted"
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: platform.color }}
              />
              {platform.name}
            </span>
          ))}
          <Link
            href={`/anime/${media.slug}`}
            className="inline-flex items-center gap-1 text-[10px] font-semibold text-brand hover:underline"
          >
            <Play className="h-3 w-3" />
            Detail & platform
          </Link>
        </div>
      </div>
    </article>
  );
}
