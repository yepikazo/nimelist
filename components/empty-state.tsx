import Link from "next/link";
import { SearchX } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  href,
  linkLabel,
  className,
}: {
  title: string;
  description: string;
  href?: string;
  linkLabel?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface/50 px-6 py-14 text-center",
        className,
      )}
    >
      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-surface-2 text-muted">
        <SearchX className="h-5 w-5" />
      </span>
      <h2 className="mt-4 text-base font-bold text-ink">{title}</h2>
      <p className="mt-1.5 max-w-md text-sm leading-6 text-muted">{description}</p>
      {href && linkLabel && (
        <Link
          href={href}
          className="mt-5 rounded-xl bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-strong"
        >
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
