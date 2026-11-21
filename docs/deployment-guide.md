# Panduan deployment Nimelist — tiga server

Status panduan ini: file Compose untuk ketiga host sudah disiapkan. Deployment produksi belum dijalankan karena memerlukan alamat server, domain, jaringan privat, dan akses administrator yang hanya tersedia dari Anda.

## Pembagian server

| Server | Isi | Akses jaringan |
|---|---|---|
| 1 — Web edge | Caddy + Next.js | Hanya host ini membuka TCP 80/443 ke publik. Next.js mengakses API Server 2 lewat jaringan privat. |
| 2 — API/data | Catalog, Schedule, Search, PostgreSQL, Redis | API diikat ke alamat privat. PostgreSQL dan Redis tetap terikat ke localhost. |
| 3 — Ingestion | Ingestion Service | Belum ada port publik; adaptor provider tetap nonaktif. |

`deploy/compose.server2.yml` mempertahankan binding localhost untuk pengembangan laptop. Pada Server 2, ubah `SERVER2_BIND_ADDRESS` ke alamat antarmuka VPN/private server. Jangan isi alamat publik.

## Yang perlu disiapkan oleh pemilik server

Sebelum deployment, catat:

- OS dan versinya, jumlah vCPU, RAM, dan ruang disk untuk setiap server.
- IP publik Server 1 dan nama domain yang akan digunakan.
- IP privat/VPN Server 1, 2, dan 3 serta bukti ketiganya dapat saling menjangkau.
- Akses SSH dengan hak sudo dan Docker Engine + Docker Compose plugin di ketiga host.
- Akses DNS untuk membuat record domain mengarah ke IP publik Server 1.
- Aturan firewall yang dapat diubah. Jangan kirim password SSH, private key, token, atau secret ke chat/repository.

Mulai dengan Tailscale, WireGuard, atau VPC provider untuk jaringan privat. Pastikan Server 1 dapat mencapai alamat privat Server 2 sebelum membuka aplikasi ke publik.

## 1. Siapkan Server 2

Clone repository ke Server 2, lalu buat salinan environment:

```bash
cp deploy/server2.env.example .env.server2
```

Isi secret unik untuk seluruh password dan `INTERNAL_API_TOKEN`. Set `SERVER2_BIND_ADDRESS` ke IP privat/VPN Server 2. Biarkan `POSTGRES_HOST_PORT` dan `REDIS_HOST_PORT` seperti contoh agar database dan Redis hanya tersedia di localhost. Simpan `.env.server2` dengan permission terbatas dan jangan commit.

Bangun service, jalankan migrasi, lalu impor seed dan isi proyeksi Search:

```bash
docker compose --env-file .env.server2 -f deploy/compose.server2.yml up -d --build
docker compose --env-file .env.server2 -f deploy/compose.server2.yml --profile init build catalog-migrate schedule-migrate search-migrate
docker compose --env-file .env.server2 -f deploy/compose.server2.yml --profile init run --rm catalog-migrate
docker compose --env-file .env.server2 -f deploy/compose.server2.yml --profile init run --rm schedule-migrate
docker compose --env-file .env.server2 -f deploy/compose.server2.yml --profile init run --rm search-migrate
docker compose --env-file .env.server2 -f deploy/compose.server2.yml --profile init run --rm seed-import
docker compose --env-file .env.server2 -f deploy/compose.server2.yml --profile init run --rm search-reindex
```

Firewall Server 2: izinkan TCP 4101–4103 hanya dari IP privat Server 1 (dan Server 3 bila kelak diperlukan). Jangan buka TCP 5432 atau 6379. Port API tidak boleh dapat dijangkau dari internet publik.

## 2. Siapkan Server 3

Clone repository dan jalankan service Ingestion:

```bash
cp deploy/server3.env.example .env.server3
docker compose --env-file .env.server3 -f deploy/compose.server3.yml up -d --build
```

Container ini saat ini hanya menyediakan health/service info. Endpoint seed/manual melalui Ingestion belum selesai; impor awal di langkah Server 2 memakai job `seed-import`. Jangan aktifkan adaptor AniList/provider sebelum fitur spesifik mendapat klarifikasi tertulis.

Firewall Server 3: tidak ada port masuk publik. Batasi SSH ke IP administrator/VPN. Tambahkan akses keluar ke provider hanya ketika adaptor dan izin penggunaan sudah ditentukan.

## 3. Siapkan Server 1

Buat DNS A/AAAA domain menuju IP publik Server 1. Pastikan TCP 80/443 dapat mencapai host ini agar Caddy dapat menerbitkan TLS. Clone repository dan siapkan environment:

```bash
cp deploy/server1.env.example .env.server1
```

Isi `SITE_DOMAIN`, `NEXT_PUBLIC_SITE_URL`, lalu ganti contoh `10.20.0.2` pada tiga URL API dengan IP privat/VPN Server 2. Jangan gunakan alamat publik Server 2.

Bangun dan jalankan web edge:

```bash
docker compose --env-file .env.server1 -f deploy/compose.server1.yml up -d --build
```

Firewall Server 1: izinkan TCP 80/443 dari internet; batasi SSH ke IP administrator/VPN. Container Next.js tidak memublikasikan port host. Caddy adalah satu-satunya container yang menerima trafik publik.

## 4. Verifikasi setelah ketiga host siap

Lakukan dari Server 1 atau melalui VPN, bukan dari internet publik:

```bash
curl -fsS http://IP_PRIVAT_SERVER_2:4101/readyz
curl -fsS http://IP_PRIVAT_SERVER_2:4102/readyz
curl -fsS http://IP_PRIVAT_SERVER_2:4103/readyz
curl -fsS 'http://IP_PRIVAT_SERVER_2:4101/v1/taxonomy'
curl -fsS 'http://IP_PRIVAT_SERVER_2:4103/v1/search?q=frieren'
curl -fsS https://DOMAIN_ANDA/api/health
```

Lalu buka domain dan periksa alur beranda → katalog → detail → jadwal → pencarian. Jadwal akan kosong sampai slot kurasi dimasukkan ke Schedule Service; seed katalog tidak mengandung jadwal demo.

## Jangan lanjut ke trafik publik sebelum

- Ketiga service API Server 2 hanya dapat dijangkau melalui jaringan privat.
- DNS/TLS domain berhasil dan port publik Server 2/3 tertutup.
- Backup PostgreSQL disimpan di luar ketiga server dan pemulihannya sudah dicoba.
- Halaman inti berhasil diverifikasi terhadap API produksi.
- Ada cara rollback image dan prosedur mengakses host jika deployment gagal.

## Batas pekerjaan saat ini

- Compose Server 1, 2, dan 3 telah tersedia sebagai konfigurasi awal. Server 2 punya profil lokal yang sudah berjalan; konfigurasi Server 1/3 belum diuji di host produksi.
- Pipeline build Docker/CI, backup off-host, deployment otomatis, dan pemulihan masih belum disiapkan.
- Ingestion masih scaffold, belum memiliki endpoint seed/manual. Server 3 belum memproses pekerjaan ingest.
- Rute sekunder, sitemap, dan metadata tertentu masih menggunakan SQLite lokal.
- Build Next.js pada laptop Codex gagal di Turbopack karena binding port lokal ditolak; build image Next.js harus menjadi verifikasi pertama di host build yang dapat menjalankan proses tersebut.
