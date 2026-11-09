import { MediaCard } from "@/components/media-card";
import type { MediaSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

export function MediaGrid({
  media,
  className,
  priorityCount = 0,
}: {
  media: MediaSummary[];
  className?: string;
  priorityCount?: number;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
        className,
      )}
    >
      {media.map((item, index) => (
        <MediaCard key={item.slug} media={item} priority={index < priorityCount} />
      ))}
    </div>
  );
}
