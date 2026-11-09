import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/constants";
import {
  getGenres,
  getIndexableMediaEntries,
  getPlatforms,
  getScheduleDateRange,
  getSeasons,
  getStudios,
} from "@/lib/repository";
import { seasonSlug, weekDates } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [media, seasons, genres, platforms, studios, scheduleRange] = await Promise.all([
    getIndexableMediaEntries(),
    getSeasons(),
    getGenres(),
    getPlatforms(),
    getStudios(),
    getScheduleDateRange(),
  ]);

  const staticUpdated = new Date("2026-11-09T00:00:00.000Z");
  const entries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: staticUpdated,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/anime`,
      lastModified: staticUpdated,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/musim`,
      lastModified: staticUpdated,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/genre`,
      lastModified: staticUpdated,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/platform`,
      lastModified: staticUpdated,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/studio`,
      lastModified: staticUpdated,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/tentang`,
      lastModified: staticUpdated,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/privasi`,
      lastModified: staticUpdated,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/ketentuan`,
      lastModified: staticUpdated,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/pedoman`,
      lastModified: staticUpdated,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/hak-cipta`,
      lastModified: staticUpdated,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/kontak`,
      lastModified: staticUpdated,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  for (const date of weekDates(scheduleRange.start)) {
    entries.push({
      url: `${SITE_URL}/jadwal-tayang/${date}`,
      lastModified: staticUpdated,
      changeFrequency: "daily",
      priority: date === scheduleRange.start ? 0.9 : 0.8,
    });
  }

  for (const item of seasons) {
    entries.push({
      url: `${SITE_URL}/musim/${seasonSlug(item.season, item.year)}`,
      lastModified: staticUpdated,
      changeFrequency: "weekly",
      priority: item.season === "FALL" && item.year === 2026 ? 0.9 : 0.6,
    });
  }

  for (const genre of genres) {
    if ((genre.count ?? 0) === 0) continue;
    entries.push({
      url: `${SITE_URL}/genre/${genre.slug}`,
      lastModified: staticUpdated,
      changeFrequency: "weekly",
      priority: 0.6,
    });
  }

  for (const platform of platforms) {
    entries.push({
      url: `${SITE_URL}/platform/${platform.slug}`,
      lastModified: staticUpdated,
      changeFrequency: "monthly",
      priority: 0.5,
    });
  }

  for (const studio of studios) {
    if ((studio.count ?? 0) === 0) continue;
    entries.push({
      url: `${SITE_URL}/studio/${studio.slug}`,
      lastModified: staticUpdated,
      changeFrequency: "monthly",
      priority: 0.4,
    });
  }

  for (const item of media) {
    entries.push({
      url: `${SITE_URL}/anime/${item.slug}`,
      lastModified: new Date(item.updatedAt),
      changeFrequency: "weekly",
      priority: 0.8,
    });
  }

  return entries;
}
