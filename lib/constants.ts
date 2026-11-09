export const SITE_NAME = "Nimelist";
export const SITE_TAGLINE =
  "Jadwal anime, sinopsis bahasa Indonesia, dan platform legal—dalam WIB.";
export const SITE_DESCRIPTION =
  "Cari jadwal tayang anime dalam WIB, baca sinopsis bahasa Indonesia, dan temukan platform legal untuk menonton.";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

export const CURRENT_SEASON = { season: "FALL", year: 2026 } as const;
export const COPYRIGHT_YEAR = 2026;

export const SEASONS = ["WINTER", "SPRING", "SUMMER", "FALL"] as const;
export type Season = (typeof SEASONS)[number] | "UNDEFINED";

export const SEASON_LABELS: Record<
  string,
  { short: string; long: string; months: string; order: number }
> = {
  WINTER: { short: "Winter", long: "Musim Dingin", months: "Jan–Mar", order: 1 },
  SPRING: { short: "Spring", long: "Musim Semi", months: "Apr–Jun", order: 2 },
  SUMMER: { short: "Summer", long: "Musim Panas", months: "Jul–Sep", order: 3 },
  FALL: { short: "Fall", long: "Musim Gugur", months: "Okt–Des", order: 4 },
  UNDEFINED: { short: "Tanpa musim", long: "Tanpa musim", months: "", order: 99 },
};

export const STATUS_LABELS: Record<string, string> = {
  FINISHED: "Selesai",
  RELEASING: "Sedang Tayang",
  NOT_YET_RELEASED: "Akan Datang",
  CANCELLED: "Dibatalkan",
  HIATUS: "Hiatus",
  UNKNOWN: "Tidak diketahui",
};

export const STATUS_SHORT_LABELS: Record<string, string> = {
  FINISHED: "Selesai",
  RELEASING: "Tayang",
  NOT_YET_RELEASED: "Akan datang",
  CANCELLED: "Batal",
  HIATUS: "Hiatus",
  UNKNOWN: "—",
};

export const FORMAT_LABELS: Record<string, string> = {
  TV: "TV",
  TV_SHORT: "TV Pendek",
  MOVIE: "Film",
  SPECIAL: "Spesial",
  OVA: "OVA",
  ONA: "ONA",
  MUSIC: "Musik",
  UNKNOWN: "Lainnya",
};

export const CONTENT_STATUS_LABELS: Record<string, string> = {
  MISSING: "Belum ditinjau",
  DRAFT: "Draf",
  REVIEWED: "Ditinjau",
  PUBLISHED: "Terbit",
  REJECTED: "Ditolak",
};

export const DAY_LABELS = [
  "",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
] as const;

export const DAY_SHORT_LABELS = [
  "",
  "Sen",
  "Sel",
  "Rab",
  "Kam",
  "Jum",
  "Sab",
  "Min",
] as const;

export const NAV_ITEMS = [
  { href: "/", label: "Beranda", icon: "home" },
  { href: "/anime", label: "Jelajah", icon: "compass" },
  { href: "/jadwal-tayang", label: "Jadwal", icon: "calendar" },
  { href: `/musim/${CURRENT_SEASON.season.toLowerCase()}-${CURRENT_SEASON.year}`, label: "Musim", icon: "layers" },
  { href: "/platform", label: "Platform", icon: "play" },
] as const;

export const SORT_OPTIONS = [
  { value: "populer", label: "Paling relevan" },
  { value: "skor", label: "Skor tertinggi" },
  { value: "judul", label: "Judul A–Z" },
  { value: "terbaru", label: "Musim terbaru" },
] as const;

export const MOODS = [
  {
    title: "Baru di musim ini",
    description: "Judul Fall 2026 yang sedang dalam sorotan.",
    href: "/musim/fall-2026",
  },
  {
    title: "Tayang hari ini",
    description: "Jadwal dalam WIB, lengkap dengan jam tayang.",
    href: "/jadwal-tayang",
  },
  {
    title: "Klasik yang wajib ditonton",
    description: "Pilihan kurasi dengan sinopsis bahasa Indonesia.",
    href: "/anime?sort=skor",
  },
] as const;
