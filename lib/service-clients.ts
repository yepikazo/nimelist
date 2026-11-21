import "server-only";

import type {
  CatalogFacets,
  CatalogFilters,
  MediaDetail,
  MediaListResult,
  MediaSummary,
  ScheduleOccurrence,
  ScheduleItem,
  StreamingLink,
} from "@/lib/types";
import { isoDayOfWeek, toJakartaDateString, weekDates } from "@/lib/utils";

type SearchHit = {
  mediaId: string;
  slug: string;
  title: string;
  titleRomaji: string;
  titleEnglish: string | null;
  coverUrl: string | null;
  score: number;
};

type SearchResponse = {
  query: string;
  items: SearchHit[];
  nextCursor: string | null;
  hasMore: boolean;
  tookMs: number;
};

const searchBaseUrl = process.env.SEARCH_SERVICE_URL ?? "http://127.0.0.1:4103";
const scheduleBaseUrl = process.env.SCHEDULE_SERVICE_URL ?? "http://127.0.0.1:4102";
const catalogBaseUrl = process.env.CATALOG_SERVICE_URL ?? "http://127.0.0.1:4101";

class ServiceNotFoundError extends Error {}

async function serviceGet<T>(url: string, serviceName: string): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(4000) });
  } catch {
    throw new Error(`${serviceName} tidak dapat dihubungi.`);
  }
  if (response.status === 404) throw new ServiceNotFoundError(`${serviceName} tidak menemukan data.`);
  if (!response.ok) throw new Error(`${serviceName} gagal memproses permintaan.`);
  return (await response.json()) as T;
}

type ScheduleApiItem = {
  mediaId: string;
  date: string;
  timeWib: string;
  episodeNumber: number;
  confidence: string;
  sourceUrl: string | null;
  media: MediaSummary;
};

type ScheduleApiResponse = { date: string; items: ScheduleApiItem[] };

export async function searchCatalog(query: string, cursor?: string): Promise<SearchResponse> {
  const params = new URLSearchParams({ q: query, limit: "24" });
  if (cursor) params.set("cursor", cursor);

  return serviceGet<SearchResponse>(`${searchBaseUrl.replace(/\/$/, "")}/v1/search?${params}`, "Search Service");
}

export function searchHitToMedia(hit: SearchHit): MediaSummary {
  return {
    id: hit.mediaId,
    slug: hit.slug,
    title: hit.title,
    titleRomaji: hit.titleRomaji,
    titleEnglish: hit.titleEnglish,
    titleId: null,
    synopsisId: null,
    format: "UNKNOWN",
    status: "UNKNOWN",
    season: null,
    seasonYear: null,
    episodes: null,
    durationMinutes: null,
    scoreAvg: null,
    popularity: 0,
    coverUrl: hit.coverUrl,
    isAdult: false,
    contentStatus: "MISSING",
    genres: [],
    studios: [],
    platforms: [],
  };
}

export async function getServiceSchedule(date: string): Promise<ScheduleItem[]> {
  const payload = await serviceGet<ScheduleApiResponse>(`${scheduleBaseUrl.replace(/\/$/, "")}/v1/schedule/${encodeURIComponent(date)}`, "Schedule Service");
  return payload.items.map((item) => ({
    id: `${item.mediaId}:${item.date}`,
    dayOfWeek: isoDayOfWeek(item.date),
    timeWib: item.timeWib,
    baseEpisode: item.episodeNumber,
    episodes: item.media.episodes,
    confidence: item.confidence,
    source: "MANUAL",
    date: item.date,
    episodeNumber: item.episodeNumber,
    media: item.media,
  }));
}

export async function getServiceMediaSchedule(mediaId: string): Promise<ScheduleOccurrence[]> {
  const payload = await serviceGet<{ items: ScheduleOccurrence[] }>(
    `${scheduleBaseUrl.replace(/\/$/, "")}/v1/schedule/media/${encodeURIComponent(mediaId)}`,
    "Schedule Service",
  );
  return payload.items;
}

export async function getServiceWeekSchedule(startDate: string): Promise<{ date: string; items: ScheduleItem[] }[]> {
  const dates = weekDates(startDate);
  const days = await Promise.all(dates.map(async (date) => ({ date, items: await getServiceSchedule(date) })));
  return days;
}

export function getJakartaToday(): string {
  return toJakartaDateString();
}

export async function getServiceTodaySchedule(): Promise<{ date: string; items: ScheduleItem[] }> {
  const date = getJakartaToday();
  return { date, items: await getServiceSchedule(date) };
}

export async function getCatalogMedia(filters: CatalogFilters = {}): Promise<MediaListResult> {
  const params = new URLSearchParams();
  for (const key of ["q", "genre", "season", "year", "status", "format", "platform", "contentStatus", "sort", "page", "pageSize"] as const) {
    const value = filters[key];
    if (value !== undefined && value !== "") params.set(key, String(value));
  }
  const query = params.size ? `?${params}` : "";
  const payload = await serviceGet<Omit<MediaListResult, "totalPages">>(`${catalogBaseUrl.replace(/\/$/, "")}/v1/media${query}`, "Catalog Service");
  return { ...payload, totalPages: Math.max(1, Math.ceil(payload.total / payload.pageSize)) };
}

export async function getCatalogFacets(): Promise<CatalogFacets> {
  return serviceGet<CatalogFacets>(`${catalogBaseUrl.replace(/\/$/, "")}/v1/taxonomy`, "Catalog Service");
}

type CatalogDetailResponse = Omit<MediaDetail, "streaming" | "scheduleSlots"> & {
  titleNative: string | null;
  synonyms: string[];
  source: string;
  sourceUrl: string | null;
  updatedAt: string;
  platformLinks: Array<{
    platformSlug: string;
    platformName: string;
    websiteUrl: string;
    searchUrlTemplate: string;
    platformColor: string;
    platformDescription: string;
    platformSortOrder: number;
    url: string;
    language: string;
    accessType: string;
    status: string;
    notes: string | null;
  }>;
};

export async function getCatalogMediaBySlug(slug: string): Promise<MediaDetail | null> {
  let payload: CatalogDetailResponse;
  try {
    payload = await serviceGet<CatalogDetailResponse>(`${catalogBaseUrl.replace(/\/$/, "")}/v1/media/${encodeURIComponent(slug)}`, "Catalog Service");
  } catch (error) {
    if (error instanceof ServiceNotFoundError) return null;
    throw error;
  }
  const streaming: StreamingLink[] = payload.platformLinks.map((link) => ({
    platform: {
      id: 0,
      slug: link.platformSlug,
      name: link.platformName,
      websiteUrl: link.websiteUrl,
      searchUrlTemplate: link.searchUrlTemplate,
      color: link.platformColor,
      description: link.platformDescription,
      sortOrder: link.platformSortOrder,
    },
    url: link.url,
    language: link.language,
    accessType: link.accessType,
    status: link.status,
    note: link.notes,
    lastVerifiedAt: null,
  }));
  const scheduleSlots = await getServiceMediaSchedule(String(payload.id));
  return { ...payload, streaming, scheduleSlots };
}

export async function getRelatedCatalogMedia(mediaId: string, genreSlugs: string[], limit = 6): Promise<MediaSummary[]> {
  const genre = genreSlugs[0];
  if (!genre) return [];
  const result = await getCatalogMedia({ genre, sort: "skor", pageSize: Math.min(60, limit + 1) });
  return result.items.filter((item) => item.id !== mediaId).slice(0, limit);
}
