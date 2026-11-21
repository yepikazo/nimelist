# Panduan deployment Nimelist — tiga server

Status panduan ini: file Compose untuk ketiga host sudah disiapkan. Deployment produksi belum dijalankan karena memerlukan akses administrator dan konfigurasi Cloudflare Tunnel yang hanya tersedia dari Anda.

## Pembagian server

| Server | Isi | Akses jaringan |
|---|---|---|
| 1 — Web edge | Cloudflare Tunnel → Caddy → Next.js | Tidak perlu port masuk publik. Next.js mengakses API Server 2 lewat jaringan privat. |
| 2 — API/data | Catalog, Schedule, Search, PostgreSQL, Redis | API diikat ke alamat privat. PostgreSQL dan Redis tetap terikat ke localhost. |
| 3 — Ingestion | Ingestion Service | IP privat `10.132.26.195`; belum ada port publik; adaptor provider tetap nonaktif. |

Alamat VM: Server 1 `10.132.26.56`, Server 2 `10.132.26.169`, Server 3 `10.132.26.195`. Pastikan alamat tersebut statis atau di-reserve di DHCP Proxmox. Masing-masing VM memiliki 2 vCPU, RAM 2 GiB, storage 10 GB, Debian 13; profil Server 2 membatasi container sekitar 1.3 GiB total.

`deploy/compose.server2.yml` mempertahankan binding localhost untuk pengembangan laptop. Pada Server 2, ubah `SERVER2_BIND_ADDRESS` ke alamat antarmuka VPN/private server. Jangan isi alamat publik.

## Yang perlu disiapkan oleh pemilik server

Sebelum deployment, catat:

- OS dan versinya, jumlah vCPU, RAM, dan ruang disk untuk setiap server.
- Domain `nimelist.yepikazo.site` dan akses dashboard Cloudflare untuk membuat Tunnel/public hostname.
- IP privat Server 1, 2, dan 3 serta tes konektivitas antar-VM.
- Akses SSH dengan hak sudo dan Docker Engine + Docker Compose plugin di ketiga host.
- Akses DNS untuk membuat record domain mengarah ke IP publik Server 1.
- Aturan firewall yang dapat diubah. Jangan kirim password SSH, private key, token, atau secret ke chat/repository.

Mulai dengan Tailscale, WireGuard, atau VPC provider untuk jaringan privat. Pastikan Server 1 dapat mencapai alamat privat Server 2 sebelum membuka aplikasi ke publik.

## 1. Siapkan Server 2

Clone repository ke Server 2 (`10.132.26.169`), lalu buat salinan environment:

```bash
cp deploy/server2.env.example .env.server2
```

Isi secret unik untuk seluruh password dan `INTERNAL_API_TOKEN`. Set `SERVER2_BIND_ADDRESS=10.132.26.169`. Biarkan `POSTGRES_HOST_PORT` dan `REDIS_HOST_PORT` seperti contoh agar database dan Redis hanya tersedia di localhost. Simpan `.env.server2` dengan permission terbatas dan jangan commit.

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

Clone repository pada Server 3 (`10.132.26.195`) dan jalankan service Ingestion:

```bash
cp deploy/server3.env.example .env.server3
docker compose --env-file .env.server3 -f deploy/compose.server3.yml up -d --build
```

Container ini saat ini hanya menyediakan health/service info. Endpoint seed/manual melalui Ingestion belum selesai; impor awal di langkah Server 2 memakai job `seed-import`. Jangan aktifkan adaptor AniList/provider sebelum fitur spesifik mendapat klarifikasi tertulis.

Firewall Server 3: tidak ada port masuk publik. Batasi SSH ke IP administrator/VPN. Tambahkan akses keluar ke provider hanya ketika adaptor dan izin penggunaan sudah ditentukan.

## 3. Siapkan Server 1

Clone repository pada Server 1 (`10.132.26.56`) dan siapkan environment:

```bash
cp deploy/server1.env.example .env.server1
```

Isi `NEXT_PUBLIC_SITE_URL=https://nimelist.yepikazo.site` dan token Tunnel dari Cloudflare. Template API sudah mengarah ke Server 2 (`10.132.26.169`); jangan ganti ke alamat publik.

Di Cloudflare Zero Trust, buat Tunnel pada Server 1 dan public hostname `nimelist.yepikazo.site` dengan service `http://caddy:80`. Simpan token Tunnel hanya di `.env.server1`, lalu jalankan web edge:

```bash
docker compose --env-file .env.server1 -f deploy/compose.server1.yml up -d --build
```

Firewall Server 1: tidak perlu membuka port masuk 80/443 untuk Tunnel; batasi SSH ke IP administrator/VPN. Next.js dan Caddy tidak memublikasikan port host. Cloudflared membuat koneksi keluar dan Caddy hanya menerima trafik dari jaringan Docker internal.

## 4. Verifikasi setelah ketiga host siap

Lakukan dari Server 1 atau melalui jaringan privat, bukan dari internet publik:

```bash
curl -fsS http://IP_PRIVAT_SERVER_2:4101/readyz
curl -fsS http://IP_PRIVAT_SERVER_2:4102/readyz
curl -fsS http://IP_PRIVAT_SERVER_2:4103/readyz
curl -fsS 'http://IP_PRIVAT_SERVER_2:4101/v1/taxonomy'
curl -fsS 'http://IP_PRIVAT_SERVER_2:4103/v1/search?q=frieren'
curl -fsS https://nimelist.yepikazo.site/api/health
```

Lalu buka domain dan periksa alur beranda → katalog → detail → jadwal → pencarian. Jadwal akan kosong sampai slot kurasi dimasukkan ke Schedule Service; seed katalog tidak mengandung jadwal demo.

## Jangan lanjut ke trafik publik sebelum

- Ketiga service API Server 2 hanya dapat dijangkau melalui jaringan privat.
- Tunnel/TLS domain berhasil; API Server 2 tidak dapat dijangkau dari internet publik.
- Backup PostgreSQL disimpan di luar ketiga server dan pemulihannya sudah dicoba.
- Halaman inti berhasil diverifikasi terhadap API produksi.
- Ada cara rollback image dan prosedur mengakses host jika deployment gagal.

## Batas pekerjaan saat ini

- Compose Server 1, 2, dan 3 telah tersedia sebagai konfigurasi awal. Server 2 punya profil lokal yang sudah berjalan; konfigurasi Server 1/3 belum diuji di host produksi.
- Pipeline build Docker/CI, backup off-host, deployment otomatis, dan pemulihan masih belum disiapkan.
- Ingestion masih scaffold, belum memiliki endpoint seed/manual. Server 3 belum memproses pekerjaan ingest.
- Rute sekunder, sitemap, dan metadata tertentu masih menggunakan SQLite lokal.
- Build Next.js pada laptop Codex gagal di Turbopack karena binding port lokal ditolak; build image Next.js harus menjadi verifikasi pertama di host build yang dapat menjalankan proses tersebut.
