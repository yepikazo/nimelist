import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { SEASON_LABELS } from "@/lib/constants";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const JAKARTA = "Asia/Jakarta";

export function toJakartaDateString(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: JAKARTA,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

export function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00+07:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export function isValidIsoDate(value: string): boolean {
  return parseIsoDate(value) !== null;
}

export function addDays(value: string, amount: number): string {
  const date = parseIsoDate(value);
  if (!date) return value;
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

/** ISO weekday: Monday = 1, Sunday = 7. */
export function isoDayOfWeek(value: string): number {
  const date = parseIsoDate(value);
  if (!date) return 1;
  const day = date.getUTCDay();
  return day === 0 ? 7 : day;
}

export function startOfWeek(value: string): string {
  return addDays(value, -(isoDayOfWeek(value) - 1));
}

export function weekDates(value: string): string[] {
  const start = startOfWeek(value);
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

export function formatDateId(
  value: string,
  options: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long", year: "numeric" },
): string {
  const date = parseIsoDate(value);
  if (!date) return value;
  return new Intl.DateTimeFormat("id-ID", { timeZone: JAKARTA, ...options }).format(date);
}

export function formatDateShort(value: string): string {
  return formatDateId(value, { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateWeekday(value: string): string {
  return formatDateId(value, { weekday: "long", day: "numeric", month: "long" });
}

export function formatRelativeDay(value: string, today: string): string {
  if (value === today) return "Hari ini";
  if (value === addDays(today, 1)) return "Besok";
  if (value === addDays(today, -1)) return "Kemarin";
  return formatDateWeekday(value);
}

export function formatTimeWib(value: string): string {
  return `${value.replace(":", ".")} WIB`;
}

export function formatScore(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "—";
  return value.toFixed(1).replace(".", ",");
}

export function scoreTone(value: number | null | undefined): "high" | "mid" | "low" | "none" {
  if (typeof value !== "number") return "none";
  if (value >= 8.5) return "high";
  if (value >= 7.5) return "mid";
  return "low";
}

export function formatEpisode(value: number | null | undefined): string {
  if (typeof value !== "number" || value <= 0) return "TBA";
  return `${value} episode`;
}

export function formatDuration(value: number | null | undefined): string {
  if (typeof value !== "number" || value <= 0) return "TBA";
  return `${value} menit`;
}

export function seasonLabel(season: string | null | undefined, year: number | null | undefined): string {
  if (!season || !year) return "Tanpa musim";
  return `${SEASON_LABELS[season]?.short ?? season} ${year}`;
}

export function seasonSlug(season: string, year: number): string {
  return `${season.toLowerCase()}-${year}`;
}

export function parseSeasonSlug(value: string): { season: string; year: number } | null {
  const match = /^(winter|spring|summer|fall)-(\d{4})$/.exec(value.toLowerCase());
  if (!match) return null;
  return { season: match[1].toUpperCase(), year: Number(match[2]) };
}

export function formatSeasonLong(season: string | null | undefined): string {
  if (!season) return "Tanpa musim";
  return SEASON_LABELS[season]?.long ?? season;
}

export function absoluteUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}

export function truncate(value: string, max = 160): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

export function buildQuery(
  base: Record<string, string | number | undefined | null>,
  overrides: Record<string, string | number | undefined | null> = {},
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...base, ...overrides })) {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export function parsePage(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const page = Number(raw);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function getSingleParam(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

export function coverFallback(title: string): string {
  return title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
}
