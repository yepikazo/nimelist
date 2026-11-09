"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Compass, Home, Layers, PlayCircle } from "lucide-react";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ICONS = {
  home: Home,
  compass: Compass,
  calendar: CalendarDays,
  layers: Layers,
  play: PlayCircle,
} as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line/80 bg-canvas/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      aria-label="Navigasi bawah"
    >
      <div className="mx-auto grid max-w-md grid-cols-5">
        {NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.icon];
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] font-semibold transition-colors",
                active ? "text-brand" : "text-muted hover:text-ink",
              )}
              aria-current={active ? "page" : undefined}
            >
              <span className="relative">
                <Icon className="h-[21px] w-[21px]" strokeWidth={active ? 2.2 : 1.8} />
                {active && (
                  <span className="absolute -right-1.5 -top-1 h-1.5 w-1.5 rounded-full bg-brand" />
                )}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
