# Nimelist

Katalog anime berbahasa Indonesia untuk jadwal WIB, sinopsis orisinal, dan tautan ke platform legal. Nimelist **tidak** menyediakan streaming, mirror, atau tautan ilegal.

Status: beta. Data Fall 2026 masih estimasi dan sebagian besar halaman detail ditandai `noindex` sampai sinopsisnya ditinjau.

## Menjalankan secara lokal

Prasyarat: Node.js 24+ (proyek memakai modul bawaan `node:sqlite`).

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). Database SQLite lokal dibuat otomatis dari `data/seed.json` saat pertama kali diakses.

Perintah lain:

```bash
npm run lint      # ESLint
npm run build     # production build + typecheck
npm start         # jalankan hasil build
```

## Data katalog

- Seed saat ini dibangun dari [anime-offline-database](https://github.com/manami-project/anime-offline-database) rilis `2026-27` (ODbL-1.0 + DbCL) ditambah kurasi manual.
- Nimelist tidak menyimpan data AniList. Integrasi provider memerlukan izin tertulis.
- Poster tetap milik pemegang haknya dan bukan bagian dari lisensi ODbL.
- Skor untuk judul Fall 2026 dikosongkan karena sampel suaranya belum reliabel.
- Tautan platform adalah tautan pencarian resmi, bukan klaim ketersediaan region Indonesia.

Membangun ulang seed:

```bash
curl -L -o /tmp/anime-offline-database.json \
  https://github.com/manami-project/anime-offline-database/releases/download/2026-27/anime-offline-database-minified.json
node scripts/build-seed.mjs --source /tmp/anime-offline-database.json
rm -rf .next
```

`rm -rf .next` diperlukan karena hasil `generateStaticParams` dan cache build dapat menyimpan snapshot katalog lama. Database lokal akan dibangun ulang otomatis ketika `generatedAt` di seed berubah.

## Arsitektur singkat

- Next.js 16 App Router, React 19, Tailwind CSS v4.
- Cache Components dan `use cache` untuk query katalog.
- Implementasi beta saat ini memakai SQLite melalui `node:sqlite` dan `lib/repository.ts`.
- Target arsitektur tugas: layanan Catalog, Schedule, Search, dan Ingestion yang dapat dibangun/deploy terpisah; Next.js menjadi web/BFF.
- Target produksi: PostgreSQL dengan kepemilikan data terpisah per service; Search API memakai PostgreSQL FTS lebih dulu, Meilisearch opsional setelah kebutuhan terukur.
- Target tiga server: Server 1 (Caddy + Next.js), Server 2 (API domain + PostgreSQL + antrean), Server 3 (ingestion worker, scheduler, admin internal).
- API publik Jikan dihentikan 1 Oktober 2026. Integrasi provider harus dapat diganti dan hanya diaktifkan setelah ketentuan penggunaan ditinjau.
- `data/nimelist.db` adalah artefak lokal dan tidak di-commit.

### Scaffold layanan

Workspace layanan tersedia di `services/` dan kontraknya di `packages/contracts/`. Catalog dan Schedule sudah memiliki API bisnis serta migrasi PostgreSQL. Search dan Ingestion masih berupa scaffold dengan `/healthz` dan `/v1/info`.

Jalankan satu layanan dari root repo:

```bash
npm run start:catalog
npm run start:schedule
npm run start:search
npm run start:ingestion
```

Port default berturut-turut `4101` sampai `4104`; setiap layanan menerima override melalui `PORT`. Checklist implementasi dan pekerjaan tersisa ada di [docs/implementation-checklist.md](docs/implementation-checklist.md).

Catalog dan Schedule memerlukan PostgreSQL terpisah dan rahasia internal yang sama. Contoh konfigurasi lokal:

```bash
export DATABASE_URL='postgres://nimelist_catalog:password@localhost:5432/nimelist_catalog'
export INTERNAL_API_TOKEN='ganti-dengan-rahasia-random-minimal-32-karakter'
npm run migrate --workspace=@nimelist/catalog-service
npm run start:catalog
```

Untuk Schedule, gunakan database dan role miliknya sendiri pada `DATABASE_URL`, set `CATALOG_SERVICE_URL` (default `http://127.0.0.1:4101`), lalu jalankan `npm run migrate --workspace=@nimelist/schedule-service` dan `npm run start:schedule`. Jangan gunakan satu database/role bersama untuk kedua service.

Importer seed Catalog mengirim metadata media, taxonomy, dan tautan pencarian platform melalui API internal, mempertahankan slug seed, dan berjalan dalam mode pratinjau secara default. Tautan dari seed tetap berstatus `SEARCH_ONLY`, bukan bukti bahwa judul tersedia di platform. Data jadwal demo tidak diimpor; jadwal dimiliki Schedule Service:

```bash
npm run seed:catalog
INTERNAL_API_TOKEN='rahasia-random-minimal-32-karakter' CATALOG_SERVICE_URL='http://127.0.0.1:4101' npm run seed:catalog -- --apply
```

Perintah kedua memerlukan Catalog berjalan, database sudah dimigrasikan, dan token yang sama dengan Catalog. Importer mengirim batch kecil secara idempoten; ia tidak menulis langsung ke database.

## Rute utama

| Rute | Isi |
| --- | --- |
| `/` | Beranda, musim berjalan, jadwal hari ini |
| `/anime` | Katalog dengan filter genre, musim, status, format, platform |
| `/anime/[slug]` | Detail, sinopsis, jadwal, tautan platform, JSON-LD |
| `/jadwal-tayang` | Redirect ke jadwal hari ini (WIB) |
| `/jadwal-tayang/[date]` | Jadwal harian dan tab mingguan |
| `/musim`, `/musim/[seasonYear]` | Arsip musim |
| `/genre`, `/genre/[slug]` | Taksonomi genre |
| `/platform`, `/platform/[slug]` | Platform legal dan tautan pencarian |
| `/studio`, `/studio/[slug]` | Studio produksi |
| `/tentang`, `/privasi`, `/ketentuan`, `/pedoman`, `/hak-cipta`, `/kontak` | Halaman informasi dan legal |
| `/api/health` | Health check JSON |
| `/sitemap.xml`, `/robots.txt` | SEO |

## Verifikasi

```bash
npm run lint
npm run build
```

Build menghasilkan halaman statis/partial-prerender untuk katalog, detail yang ditinjau, jadwal mingguan, genre, platform, dan studio. Halaman detail yang belum ditinjau tetap dapat diakses tetapi memakai metadata `noindex, follow`.

## Batasan sebelum peluncuran

- Tinjau ODbL attribution/share-alike dan kebijakan penggunaan poster bersama penasihat hukum.
- Ganti alamat kontak placeholder sebelum produksi.
- Pindahkan data ke PostgreSQL dan lakukan verifikasi ketersediaan platform per judul.
- Tambahkan analitik/iklan hanya setelah Core Web Vitals stabil.
