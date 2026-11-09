import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { buildQuery, cn } from "@/lib/utils";

export function Pagination({
  basePath,
  page,
  totalPages,
  params = {},
  className,
}: {
  basePath: string;
  page: number;
  totalPages: number;
  params?: Record<string, string | number | undefined | null>;
  className?: string;
}) {
  if (totalPages <= 1) return null;

  const prev = page > 1 ? `${basePath}${buildQuery(params, { page: page - 1 })}` : null;
  const next =
    page < totalPages ? `${basePath}${buildQuery(params, { page: page + 1 })}` : null;

  return (
    <nav
      className={cn("mt-8 flex items-center justify-between gap-3", className)}
      aria-label="Paginasi"
    >
      {prev ? (
        <Link
          href={prev}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Sebelumnya
        </Link>
      ) : (
        <span />
      )}
      <span className="font-mono text-[11px] text-muted">
        Halaman {page} / {totalPages}
      </span>
      {next ? (
        <Link
          href={next}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink transition-colors hover:bg-surface-2"
        >
          Berikutnya
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
