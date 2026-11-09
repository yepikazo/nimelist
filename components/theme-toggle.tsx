"use client";

import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  function toggle() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("nimelist-theme", next ? "dark" : "light");
    } catch {
      // ignore storage errors
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-xl border border-line bg-surface/70 text-muted transition-colors hover:bg-surface-2 hover:text-ink",
        className,
      )}
      aria-label="Ganti tema terang atau gelap"
      title="Ganti tema"
    >
      <Moon className="h-[18px] w-[18px] dark:hidden" />
      <Sun className="hidden h-[18px] w-[18px] dark:block" />
    </button>
  );
}
