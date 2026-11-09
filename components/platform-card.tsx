import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Platform } from "@/lib/types";
import { getInitials } from "@/lib/utils";

export function PlatformCard({ platform }: { platform: Platform }) {
  return (
    <Link
      href={`/platform/${platform.slug}`}
      className="group flex items-center gap-3 rounded-2xl border border-line bg-surface p-3.5 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-card"
    >
      <span
        className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-extrabold text-white"
        style={{ backgroundColor: platform.color }}
      >
        {getInitials(platform.name)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-bold text-ink">{platform.name}</span>
          <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
        <span className="mt-0.5 block truncate text-[11px] text-muted">
          {platform.count ? `${platform.count} judul ditautkan` : platform.description}
        </span>
      </span>
    </Link>
  );
}
