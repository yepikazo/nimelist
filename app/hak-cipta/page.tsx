import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Hak Cipta, Atribusi Data, dan Takedown",
  description:
    "Atribusi anime-offline-database (ODbL-1.0), kebijakan poster, dan cara mengajukan permintaan takedown hak cipta ke Nimelist.",
  alternates: { canonical: "/hak-cipta" },
};

export default function CopyrightPage() {
  return (
    <LegalPage
      title="Hak Cipta & Takedown"
      description="Kami menghormati hak cipta. Halaman ini menjelaskan lisensi data, status gambar, dan cara mengajukan permintaan penghapusan."
      updated="2026-11-09"
    >
      <h2>1. Atribusi data katalog</h2>
      <p>
        Sebagian data katalog Nimelist berasal dari{" "}
        <a
          href="https://github.com/manami-project/anime-offline-database"
          target="_blank"
          rel="noreferrer"
        >
          anime-offline-database
        </a>
        , sebuah basis data terbuka yang didistribusikan dengan lisensi{" "}
        <strong>Open Database License (ODbL) 1.0</strong> dan Database Contents License
        (DbCL) 1.0. Rilis yang digunakan untuk seed beta adalah rilis 2026-27.
      </p>
      <p>
        Kami menggunakan subset data untuk keperluan katalog, melakukan normalisasi genre
        dan studio, serta menambahkan metadata dan sinopsis orisinal. Sesuai ODbL, versi
        basis data turunan yang kami publikasikan tetap menyebutkan sumber dan lisensi.
        Jika kamu menggunakan kembali data dari Nimelist, kamu wajib mematuhi ODbL,
        termasuk kewajiban atribusi dan share-alike untuk basis data.
      </p>

      <h2>2. Poster dan gambar</h2>
      <p>
        Poster anime adalah karya berhak cipta milik penerbit, studio, atau pemegang hak
        terkait. Nimelist menampilkan gambar melalui URL dari sumber data eksternal sebagai
        referensi visual untuk identifikasi judul. Kami tidak mengklaim kepemilikan atau
        lisensi atas gambar tersebut.
      </p>
      <p>
        Jika kamu adalah pemegang hak dan tidak ingin gambar tertentu ditampilkan, kami
        akan menindaklanjuti permintaan yang wajar, termasuk mengganti gambar dengan
        placeholder atau menghapusnya.
      </p>

      <h2>3. Sinopsis dan tulisan orisinal</h2>
      <p>
        Sinopsis berbahasa Indonesia di Nimelist ditulis ulang secara orisinal dan ditinjau
        sebelum terbit. Kami tidak menerbitkan terjemahan mesin dari sinopsis berhak cipta.
        Kutipan singkat dengan atribusi dan tautan diperbolehkan; penyalinan utuh untuk
        diterbitkan ulang memerlukan izin.
      </p>

      <h2>4. Tautan platform</h2>
      <p>
        Nimelist tidak meng-host video. Tautan pada halaman anime membuka halaman pencarian
        platform resmi. Jika kamu menemukan tautan yang mengarah ke layanan ilegal,{" "}
        <Link href="/kontak">laporkan kepada kami</Link> agar dapat diperiksa.
      </p>

      <h2>5. Cara mengajukan takedown</h2>
      <p>
        Kirim permintaan ke alamat kontak yang tercantum di{" "}
        <Link href="/kontak">halaman kontak</Link> dengan informasi berikut:
      </p>
      <ul>
        <li>Nama dan informasi kontak kamu.</li>
        <li>URL halaman Nimelist yang memuat materi yang dimaksud.</li>
        <li>Identifikasi materi berhak cipta dan bukti kepemilikan atau kewenangan.</li>
        <li>Pernyataan bahwa penggunaan materi tidak diizinkan.</li>
        <li>Tindakan yang diminta: hapus, ganti, atau tambahkan atribusi.</li>
      </ul>
      <p>
        Kami akan meninjau permintaan dan dapat meminta klarifikasi. Untuk permintaan yang
        sah dan jelas, kami berupaya merespons dalam waktu yang wajar. Permintaan yang
        bertujuan mengganggu layanan atau tanpa dasar dapat ditolak.
      </p>

      <h2>6. Kontak</h2>
      <p>
        Untuk urusan hak cipta, gunakan subjek &quot;Takedown&quot; melalui{" "}
        <Link href="/kontak">halaman kontak</Link>. Untuk koreksi data non-hak cipta,
        gunakan subjek &quot;Koreksi data&quot;.
      </p>
    </LegalPage>
  );
}
