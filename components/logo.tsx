import Link from "next/link";
import { Clapperboard } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  compact = false,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link
      href="/"
      className={cn("group inline-flex items-center gap-2.5 rounded-xl", className)}
      aria-label="Nimelist — beranda"
    >
      <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-brand text-white shadow-glow transition-transform duration-200 group-hover:-rotate-3">
        <Clapperboard className="h-[18px] w-[18px]" strokeWidth={2.2} />
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-amber ring-2 ring-canvas" />
      </span>
      {!compact && (
        <span className="flex items-baseline gap-1.5">
          <span className="text-[17px] font-extrabold tracking-[-0.04em] text-ink">
            Nimelist
          </span>
          <span className="rounded-full border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-wider text-muted">
            beta
          </span>
        </span>
      )}
    </Link>
  );
}
