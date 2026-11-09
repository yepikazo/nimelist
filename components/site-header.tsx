"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  Compass,
  Home,
  Layers,
  PlayCircle,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { NAV_ITEMS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const ICONS = {
  home: Home,
  compass: Compass,
  calendar: CalendarDays,
  layers: Layers,
  play: PlayCircle,
} as const;

const QUICK_LINKS = [
  { href: "/musim/fall-2026", label: "Fall 2026", icon: Sparkles },
  { href: "/jadwal-tayang", label: "Jadwal hari ini", icon: CalendarDays },
  { href: "/genre/isekai", label: "Genre isekai", icon: Compass },
  { href: "/platform", label: "Platform legal", icon: PlayCircle },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable;
      if (event.key === "/" && !isTyping && !open) {
        event.preventDefault();
        setOpen(true);
      }
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line/80 bg-canvas/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Logo />

          <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Navigasi utama">
            {NAV_ITEMS.map((item) => {
              const Icon = ICONS[item.icon];
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors",
                    isActive(item.href)
                      ? "bg-brand-soft text-brand"
                      : "text-muted hover:bg-surface-2 hover:text-ink",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <Link
              href="/tentang"
              className="rounded-lg px-3 py-2 text-[13px] font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-ink"
            >
              Tentang
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="flex h-9 items-center gap-2 rounded-xl border border-line bg-surface/70 px-3 text-muted transition-colors hover:bg-surface-2 hover:text-ink"
              aria-label="Buka pencarian"
            >
              <Search className="h-[18px] w-[18px]" />
              <span className="hidden text-xs font-medium sm:inline">Cari anime</span>
              <kbd className="ml-1 hidden rounded border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-muted md:inline">
                /
              </kbd>
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-[8vh] backdrop-blur-sm sm:pt-[12vh]"
          role="dialog"
          aria-modal="true"
          aria-label="Pencarian anime"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
            <form
              action="/anime"
              method="get"
              className="flex items-center gap-3 border-b border-line px-4 py-3"
              onSubmit={() => setOpen(false)}
            >
              <Search className="h-5 w-5 shrink-0 text-brand" />
              <input
                autoFocus
                type="search"
                name="q"
                placeholder="Cari judul, genre, atau studio…"
                className="h-10 w-full bg-transparent text-[15px] text-ink placeholder:text-muted focus:outline-none"
                aria-label="Kata kunci pencarian"
              />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink"
                aria-label="Tutup pencarian"
              >
                <X className="h-4 w-4" />
              </button>
            </form>
            <div className="p-3">
              <p className="px-2 pb-2 font-mono text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
                Mulai cepat
              </p>
              <div className="grid gap-1 sm:grid-cols-2">
                {QUICK_LINKS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-surface-2"
                    >
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand-soft text-brand">
                        <Icon className="h-4 w-4" />
                      </span>
                      {item.label}
                      <ArrowRight className="ml-auto h-4 w-4 text-muted" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
