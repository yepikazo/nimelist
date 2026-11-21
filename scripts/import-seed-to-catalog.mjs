#!/usr/bin/env node
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const root = resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const apply = args.includes("--apply");
const seedArg = args.find((arg) => arg.startsWith("--seed="))?.slice("--seed=".length);
const seedPath = resolve(seedArg ?? `${root}/data/seed.json`);
const baseUrl = (process.env.CATALOG_SERVICE_URL ?? "http://127.0.0.1:4101").replace(/\/$/, "");
const token = process.env.INTERNAL_API_TOKEN;
const concurrency = 4;

function payloadFor(media) {
  const sourceUrl = media.sourceUrl ?? null;
  const anidbId = sourceUrl?.match(/anidb\.net\/anime\/(\d+)/)?.[1];
  const body = {
    provider: "offline-db",
    externalId: anidbId ?? `seed-${media.slug}`,
    sourceUrl,
    slug: media.slug,
    titleRomaji: media.titleRomaji,
    titleEnglish: media.titleEnglish,
    titleNative: media.titleNative,
    titleId: media.titleId,
    synopsisId: media.synopsisId,
    format: media.format,
    status: media.status,
    season: media.season,
    seasonYear: media.seasonYear,
    episodes: media.episodes,
    durationMinutes: media.durationMinutes,
    scoreAvg: media.scoreAvg,
    popularity: media.popularity,
    coverUrl: media.coverUrl,
    bannerUrl: media.bannerUrl,
    synonyms: media.synonyms,
    genres: media.genres,
    studios: media.studios,
    platformLinks: (media.streaming ?? []).map((link) => ({
      platformSlug: link.platformSlug,
      url: link.url,
      language: link.language,
      accessType: link.accessType,
      status: "SEARCH_ONLY",
      notes: link.note,
    })),
    isAdult: Boolean(media.isAdult),
    contentStatus: media.contentStatus,
  };
  if (media.contentStatus === "REVIEWED" || media.contentStatus === "PUBLISHED") {
    body.curatedFields = ["slug", "title_id", "synopsis_id", "content_status", "format"];
  }
  return body;
}

async function postInternal(path, body, key) {
  let lastError;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    let response;
    try {
      response = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
          "idempotency-key": key,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10_000),
      });
    } catch (error) {
      lastError = error;
    }
    if (response) {
      const result = await response.json().catch(() => ({}));
      if (response.ok) return result;
      const message = result.error?.message ?? `Catalog mengembalikan HTTP ${response.status}`;
      lastError = new Error(message);
      if (response.status < 500 && response.status !== 429) throw lastError;
    }
    if (attempt < 4) await new Promise((resolveDelay) => setTimeout(resolveDelay, 250 * (2 ** attempt)));
  }
  throw lastError ?? new Error(`Gagal mengirim permintaan internal ${path}.`);
}

function importKey(prefix, body) {
  return `${prefix}-${createHash("sha256").update(JSON.stringify(body)).digest("hex")}`;
}

async function importOne(media) {
  const body = payloadFor(media);
  const result = await postInternal("/internal/v1/media/import", body, importKey("seed", body));
  return { slug: media.slug, status: result.status };
}

async function importTaxonomy(seed) {
  const body = {
    genres: seed.genres.map(({ slug, name, nameId, description }) => ({ slug, name, nameId, description })),
    studios: seed.studios.map(({ slug, name, nameNative, websiteUrl }) => ({ slug, name, nameNative, websiteUrl })),
    platforms: seed.platforms.map(({ slug, name, websiteUrl, searchUrlTemplate, color, description, sortOrder }) => ({
      slug, name, websiteUrl, searchUrlTemplate, color, description, sortOrder,
    })),
  };
  return postInternal("/internal/v1/taxonomy/import", body, importKey("seed-taxonomy", body));
}

async function main() {
  const seed = JSON.parse(await readFile(seedPath, "utf8"));
  if (!Array.isArray(seed.media) || seed.media.length === 0) throw new Error("Seed harus memiliki array media yang tidak kosong.");
  if (![seed.genres, seed.studios, seed.platforms].every(Array.isArray)) throw new Error("Seed harus memiliki array genres, studios, dan platforms.");
  if (!apply) {
    console.log(JSON.stringify({
      mode: "dry-run",
      seedPath,
      source: seed.source,
      generatedAt: seed.generatedAt,
      mediaCount: seed.media.length,
      reviewedCount: seed.media.filter((media) => ["REVIEWED", "PUBLISHED"].includes(media.contentStatus)).length,
      genreCount: seed.genres.length,
      studioCount: seed.studios.length,
      platformCount: seed.platforms.length,
      platformSearchLinkCount: seed.media.reduce((count, media) => count + (media.streaming?.length ?? 0), 0),
      sampleSlugs: seed.media.slice(0, 5).map((media) => media.slug),
      instruction: "Tambahkan --apply untuk mengirim data ke Catalog Service.",
    }, null, 2));
    return;
  }
  if (!token || token.length < 32) throw new Error("INTERNAL_API_TOKEN wajib diisi dan minimal 32 karakter.");
  const taxonomy = await importTaxonomy(seed);
  console.log(JSON.stringify({ stage: "taxonomy", ...taxonomy }));
  const results = [];
  for (let offset = 0; offset < seed.media.length; offset += concurrency) {
    const batch = seed.media.slice(offset, offset + concurrency);
    results.push(...await Promise.all(batch.map(importOne)));
    console.log(JSON.stringify({ processed: results.length, total: seed.media.length }));
  }
  const counts = Object.groupBy(results, (item) => item.status);
  console.log(JSON.stringify({
    mode: "applied",
    seedPath,
    generatedAt: seed.generatedAt,
    mediaCount: results.length,
    statuses: Object.fromEntries(Object.entries(counts).map(([status, items]) => [status, items.length])),
  }, null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    console.error(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
    process.exitCode = 1;
  });
}
