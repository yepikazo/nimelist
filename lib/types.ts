export interface Genre {
  id: number;
  slug: string;
  name: string;
  nameId: string;
  description: string | null;
  count?: number;
}

export interface Studio {
  id: number;
  slug: string;
  name: string;
  count?: number;
}

export interface Platform {
  id: number;
  slug: string;
  name: string;
  websiteUrl: string;
  searchUrlTemplate: string;
  color: string;
  description: string;
  sortOrder: number;
  count?: number;
}

export interface StreamingLink {
  platform: Platform;
  url: string;
  language: string;
  accessType: string;
  status: string;
  note: string | null;
  lastVerifiedAt: string | null;
}

export interface ScheduleSlot {
  id: number;
  dayOfWeek: number;
  timeWib: string;
  baseEpisode: number;
  episodes: number | null;
  confidence: string;
  source: string;
}

export interface ScheduleOccurrence extends ScheduleSlot {
  date: string;
  episodeNumber: number;
}

export interface MediaSummary {
  id: number;
  slug: string;
  title: string;
  titleRomaji: string;
  titleEnglish: string | null;
  titleId: string | null;
  synopsisId: string | null;
  format: string;
  status: string;
  season: string | null;
  seasonYear: number | null;
  episodes: number | null;
  durationMinutes: number | null;
  scoreAvg: number | null;
  popularity: number;
  coverUrl: string | null;
  isAdult: boolean;
  contentStatus: string;
  genres: Genre[];
  studios: Studio[];
  platforms: Platform[];
}

export interface MediaDetail extends MediaSummary {
  titleNative: string | null;
  synonyms: string[];
  source: string;
  sourceUrl: string | null;
  updatedAt: string;
  streaming: StreamingLink[];
  scheduleSlots: ScheduleOccurrence[];
}

export interface MediaListResult {
  items: MediaSummary[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ScheduleItem extends ScheduleOccurrence {
  media: MediaSummary;
}

export interface CatalogFilters {
  q?: string;
  genre?: string;
  season?: string;
  year?: number;
  status?: string;
  format?: string;
  contentStatus?: string;
  platform?: string;
  studio?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}

export interface CatalogFacets {
  genres: Genre[];
  studios: Studio[];
  platforms: Platform[];
  seasons: { season: string; year: number; count: number }[];
}
