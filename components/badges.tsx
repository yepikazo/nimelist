import { CheckCircle2, Clock3, Star } from "lucide-react";
import { STATUS_LABELS, STATUS_SHORT_LABELS } from "@/lib/constants";
import { cn, formatScore, scoreTone } from "@/lib/utils";

export function Pill({
  children,
  className,
  as = "span",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "span" | "div";
}) {
  const Component = as;
  return (
    <Component
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-line bg-surface/70 px-2 py-0.5 text-[10px] font-semibold leading-5 text-muted",
        className,
      )}
    >
      {children}
    </Component>
  );
}

export function ScoreBadge({
  score,
  className,
}: {
  score: number | null | undefined;
  className?: string;
}) {
  if (typeof score !== "number") return null;
  const tone = scoreTone(score);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-1 font-mono text-[11px] font-semibold leading-none shadow-sm backdrop-blur",
        tone === "high" && "bg-amber text-black",
        tone === "mid" && "bg-white/90 text-neutral-900",
        tone === "low" && "bg-black/60 text-white ring-1 ring-white/20",
        className,
      )}
      aria-label={`Skor ${formatScore(score)} dari 10`}
    >
      <Star className="h-3 w-3 fill-current" />
      {formatScore(score)}
    </span>
  );
}

export function StatusBadge({
  status,
  short = false,
  className,
}: {
  status: string;
  short?: boolean;
  className?: string;
}) {
  const label = short ? STATUS_SHORT_LABELS[status] : STATUS_LABELS[status];
  return (
    <Pill
      className={cn(
        status === "RELEASING" && "border-success/25 bg-success/10 text-success",
        status === "NOT_YET_RELEASED" && "border-amber/30 bg-amber/10 text-amber",
        status === "FINISHED" && "border-line bg-surface-2 text-muted",
        className,
      )}
    >
      {status === "RELEASING" && <span className="h-1.5 w-1.5 rounded-full bg-success" />}
      {label ?? status}
    </Pill>
  );
}

export function EstimateBadge({ className }: { className?: string }) {
  return (
    <Pill className={cn("border-amber/30 bg-amber/10 text-amber", className)}>
      <Clock3 className="h-3 w-3" />
      Estimasi
    </Pill>
  );
}

export function ReviewedBadge({ className }: { className?: string }) {
  return (
    <Pill className={cn("border-success/25 bg-success/10 text-success", className)}>
      <CheckCircle2 className="h-3 w-3" />
      Sinopsis ditinjau
    </Pill>
  );
}

export function FormatBadge({
  format,
  className,
}: {
  format: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "rounded-md bg-black/65 px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide text-white backdrop-blur",
        className,
      )}
    >
      {format === "TV" ? "TV" : format === "MOVIE" ? "Film" : format === "ONA" ? "ONA" : format}
    </span>
  );
}
