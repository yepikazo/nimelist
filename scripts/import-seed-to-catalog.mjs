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
    isAdult: Boolean(media.isAdult),
    contentStatus: media.contentStatus,
  };
  if (media.contentStatus === "REVIEWED" || media.contentStatus === "PUBLISHED") {
    body.curatedFields = ["slug", "title_id", "synopsis_id", "content_status", "format"];
  }
  return body;
}

function idempotencyKey(body) {
  return `seed-${createHash("sha256").update(JSON.stringify(body)).digest("hex")}`;
}

async function importOne(media) {
  const body = payloadFor(media);
  const key = idempotencyKey(body);
  let lastError;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const response = await fetch(`${baseUrl}/internal/v1/media/import`, {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
          "idempotency-key": key,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10_000),
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok) return { slug: media.slug, status: result.status };
      const message = result.error?.message ?? `Catalog mengembalikan HTTP ${response.status}`;
      if (response.status < 500 && response.status !== 429) throw new Error(`${media.slug}: ${message}`);
      lastError = new Error(`${media.slug}: ${message}`);
    } catch (error) {
      if (error instanceof Error && /: Catalog mengembalikan HTTP|: /.test(error.message) && !/fetch failed|timed out/i.test(error.message)) throw error;
      lastError = error;
    }
    if (attempt < 4) await new Promise((resolveDelay) => setTimeout(resolveDelay, 250 * (2 ** attempt)));
  }
  throw lastError ?? new Error(`Gagal mengimpor ${media.slug}.`);
}

async function main() {
  const seed = JSON.parse(await readFile(seedPath, "utf8"));
  if (!Array.isArray(seed.media) || seed.media.length === 0) throw new Error("Seed harus memiliki array media yang tidak kosong.");
  if (!apply) {
    console.log(JSON.stringify({
      mode: "dry-run",
      seedPath,
      source: seed.source,
      generatedAt: seed.generatedAt,
      mediaCount: seed.media.length,
      reviewedCount: seed.media.filter((media) => ["REVIEWED", "PUBLISHED"].includes(media.contentStatus)).length,
      sampleSlugs: seed.media.slice(0, 5).map((media) => media.slug),
      instruction: "Tambahkan --apply untuk mengirim data ke Catalog Service.",
    }, null, 2));
    return;
  }
  if (!token || token.length < 32) throw new Error("INTERNAL_API_TOKEN wajib diisi dan minimal 32 karakter.");
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
