import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Tentang Nimelist",
  description:
    "Nimelist adalah katalog anime Indonesia untuk jadwal WIB, sinopsis orisinal, dan tautan platform legal. Baca prinsip data dan kebijakan editorial kami.",
  alternates: { canonical: "/tentang" },
};

export default function AboutPage() {
  return (
    <LegalPage
      title="Tentang Nimelist"
      description="Katalog anime yang fokus pada kejelasan: kapan tayang, tentang apa, dan di mana menontonnya secara legal."
    >
      <h2>Apa itu Nimelist?</h2>
      <p>
        Nimelist adalah katalog anime berbahasa Indonesia yang dibangun untuk menjawab tiga
        pertanyaan sederhana: <strong>kapan anime tayang dalam WIB</strong>,{" "}
        <strong>tentang apa ceritanya</strong>, dan <strong>di platform legal mana bisa
        menontonnya</strong>. Kami tidak menyediakan video, mirror, atau tautan streaming
        ilegal.
      </p>
      <p>
        Versi ini adalah beta publik. Artinya, sebagian data masih berupa metadata mentah
        dari basis data terbuka dan belum melalui kurasi penuh. Kami menandai data yang
        belum ditinjau agar kamu tidak mengira informasi estimasi sebagai fakta final.
      </p>

      <h2>Prinsip data</h2>
      <ul>
        <li>
          <strong>Baca dari data kami sendiri.</strong> Pengunjung tidak memanggil API pihak
          ketiga secara langsung. Data masuk melalui proses kurasi dan penyimpanan lokal.
        </li>
        <li>
          <strong>Tidak mengarang ketersediaan.</strong> Tautan platform adalah tautan
          pencarian resmi, bukan klaim bahwa judul tersedia di region Indonesia.
        </li>
        <li>
          <strong>Tidak menampilkan skor palsu.</strong> Skor yang tidak reliabel untuk judul
          baru dikosongkan, bukan diisi angka tinggi dari sampel suara yang sedikit.
        </li>
        <li>
          <strong>Sinopsis orisinal.</strong> Sinopsis yang terbit ditulis ulang dalam bahasa
          Indonesia dan ditinjau. Kami tidak menerbitkan terjemahan mesin dari sinopsis
          berhak cipta.
        </li>
        <li>
          <strong>Transparan soal sumber.</strong> Data katalog sebagian berasal dari{" "}
          <a
            href="https://github.com/manami-project/anime-offline-database"
            target="_blank"
            rel="noreferrer"
          >
            anime-offline-database
          </a>{" "}
          dengan lisensi ODbL-1.0.
        </li>
      </ul>

      <h2>Sumber data dan batasan</h2>
      <p>
        Seed katalog saat ini menggunakan subset Fall 2026 dari rilis{" "}
        <code>anime-offline-database</code> (ODbL-1.0) ditambah kurasi manual untuk judul
        klasik. Kami belum menyimpan data dari AniList karena integrasi tersebut memerlukan
        izin tertulis dan tidak sesuai dengan ketentuan layanan mereka untuk penggunaan
        semacam ini.
      </p>
      <p>
        Poster ditampilkan sebagai referensi dari sumber eksternal. Hak cipta poster tetap
        milik pemiliknya. Jika kamu adalah pemegang hak dan ingin gambar tertentu
        dihapus, lihat <Link href="/hak-cipta">halaman hak cipta</Link>.
      </p>

      <h2>Status beta dan rencana</h2>
      <ul>
        <li>Belum ada akun publik, watchlist, atau komentar.</li>
        <li>Jadwal Fall 2026 masih estimasi dan akan diperbarui setelah konfirmasi.</li>
        <li>Halaman detail tanpa sinopsis ditandai <code>noindex</code> agar tidak menjadi halaman tipis di mesin pencari.</li>
        <li>Pencarian masih menggunakan SQLite untuk pengembangan; target produksi adalah PostgreSQL FTS + pg_trgm.</li>
        <li>Iklan tidak akan dipasang sampai trafik dan Core Web Vitals stabil.</li>
      </ul>

      <h2>Kontak</h2>
      <p>
        Untuk koreksi data, laporan tautan bermasalah, atau pertanyaan editorial, kunjungi{" "}
        <Link href="/kontak">halaman kontak</Link>. Kami membaca setiap laporan, tetapi
        respons dapat memakan waktu selama masa beta.
      </p>
    </LegalPage>
  );
}
