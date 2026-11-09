/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { Star } from "lucide-react";
import { FormatBadge, ScoreBadge } from "@/components/badges";
import type { MediaSummary } from "@/lib/types";
import {
  cn,
  coverFallback,
  formatEpisode,
  seasonLabel,
} from "@/lib/utils";

export function MediaCard({
  media,
  priority = false,
  className,
}: {
  media: MediaSummary;
  priority?: boolean;
  className?: string;
}) {
  const platform = media.platforms[0];
  const meta =
    media.format === "MOVIE"
      ? seasonLabel(media.season, media.seasonYear)
      : `${seasonLabel(media.season, media.seasonYear)} · ${formatEpisode(media.episodes)}`;

  return (
    <Link
      href={`/anime/${media.slug}`}
      className={cn(
        "group flex min-w-0 flex-col rounded-2xl focus-visible:outline-none",
        className,
      )}
      aria-label={`${media.title} — ${meta}`}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-2xl border border-line bg-surface-2 shadow-card">
        {media.coverUrl ? (
          <img
            src={media.coverUrl}
            alt={`Poster ${media.title}`}
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : "auto"}
            decoding="async"
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.035]"
          />
        ) : (
          <div className="poster-fallback flex h-full items-center justify-center">
            <span className="font-mono text-2xl font-bold tracking-tight text-white/80">
              {coverFallback(media.title)}
            </span>
          </div>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        <div className="absolute left-2 top-2 flex items-center gap-1.5">
          <FormatBadge format={media.format} />
          {media.status === "RELEASING" && (
            <span className="inline-flex items-center gap-1 rounded-md bg-success/90 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide text-black">
              <span className="h-1 w-1 rounded-full bg-black" />
              Tayang
            </span>
          )}
        </div>
        {typeof media.scoreAvg === "number" && (
          <div className="absolute right-2 top-2">
            <ScoreBadge score={media.scoreAvg} />
          </div>
        )}
        <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-2">
          <span className="truncate font-mono text-[10px] font-medium text-white/80">
            {seasonLabel(media.season, media.seasonYear)}
          </span>
          {typeof media.scoreAvg !== "number" && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-white/70">
              <Star className="h-3 w-3" />
              Belum ada skor
            </span>
          )}
        </div>
      </div>

      <div className="mt-2.5 min-w-0 px-0.5">
        <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-ink transition-colors group-hover:text-brand">
          {media.title}
        </h3>
        <div className="mt-1 flex items-center gap-2 text-[11px] text-muted">
          <span className="truncate">{meta}</span>
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-muted">
          {platform ? (
            <>
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: platform.color }}
              />
              <span className="truncate">Cek di {platform.name}</span>
              {media.platforms.length > 1 && (
                <span className="text-muted/70">+{media.platforms.length - 1}</span>
              )}
            </>
          ) : (
            <span>Platform belum dicek</span>
          )}
        </div>
      </div>
    </Link>
  );
}
