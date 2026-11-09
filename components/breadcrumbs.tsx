import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Breadcrumbs({
  items,
  className,
}: {
  items: { label: string; href?: string }[];
  className?: string;
}) {
  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1 overflow-x-auto", className)}>
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="flex shrink-0 items-center gap-1">
          {index > 0 && <ChevronRight className="h-3 w-3 text-muted/60" />}
          {item.href ? (
            <Link
              href={item.href}
              className="rounded px-0.5 text-[11px] font-medium text-muted transition-colors hover:text-ink"
            >
              {item.label}
            </Link>
          ) : (
            <span className="px-0.5 text-[11px] font-medium text-ink/80" aria-current="page">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
