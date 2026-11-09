import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Kebijakan Privasi",
  description:
    "Kebijakan privasi Nimelist: data apa yang diproses, cookie tema, log server, tautan pihak ketiga, dan hak kamu.",
  alternates: { canonical: "/privasi" },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Kebijakan Privasi"
      description="Kami berusaha mengumpulkan sesedikit mungkin data. Versi beta ini tidak memiliki akun pengguna, iklan, atau pelacakan lintas situs."
      updated="2026-11-09"
    >
      <p>
        Kebijakan ini menjelaskan bagaimana Nimelist memproses informasi ketika kamu
        mengunjungi situs. Dengan menggunakan situs, kamu memahami praktik yang dijelaskan
        di sini. Jika kamu tidak setuju, mohon berhenti menggunakan layanan.
      </p>

      <h2>1. Data yang kami proses</h2>
      <h3>Data yang kamu berikan</h3>
      <p>
        Versi beta tidak memiliki formulir akun, komentar, atau profil publik. Jika kamu
        menghubungi kami melalui email, kami akan menerima alamat email dan isi pesan yang
        kamu kirim. Data itu hanya digunakan untuk menanggapi laporan atau pertanyaan.
      </p>
      <h3>Data teknis otomatis</h3>
      <p>
        Seperti situs web pada umumnya, server dapat mencatat informasi teknis minimal
        seperti alamat IP, waktu permintaan, URL yang diminta, tipe perangkat, dan status
        respons. Log ini digunakan untuk keamanan, debugging, dan mencegah penyalahgunaan.
        Kami tidak menggunakannya untuk membuat profil iklan.
      </p>
      <h3>Preferensi tema</h3>
      <p>
        Pilihan tema terang atau gelap disimpan di <code>localStorage</code> peramban kamu
        dengan nama <code>nimelist-theme</code>. Nilai ini tidak dikirim ke server dan dapat
        kamu hapus dengan membersihkan data situs di peramban.
      </p>

      <h2>2. Cookie dan teknologi serupa</h2>
      <p>
        Nimelist tidak memasang cookie iklan atau cookie pelacakan pihak ketiga pada versi
        ini. Jika di masa depan kami menambahkan analitik atau iklan, kebijakan ini akan
        diperbarui dan, bila diperlukan, persetujuan akan diminta terlebih dahulu.
      </p>

      <h2>3. Tautan pihak ketiga</h2>
      <p>
        Halaman anime dan platform berisi tautan ke situs pihak ketiga, termasuk platform
        streaming resmi dan sumber data eksternal. Kami tidak mengontrol kebijakan privasi
        mereka. Saat kamu mengklik tautan, kebijakan situs tujuan berlaku. Baca kebijakan
        privasi platform sebelum mendaftar atau berlangganan.
      </p>

      <h2>4. Dasar pemrosesan dan penyimpanan</h2>
      <p>
        Kami memproses data teknis berdasarkan kepentingan sah untuk menjalankan dan
        mengamankan situs, serta berdasarkan persetujuan atau permintaan kamu ketika kamu
        menghubungi kami. Log server disimpan untuk periode terbatas yang diperlukan untuk
        keamanan dan debugging, lalu dihapus atau dianonimkan.
      </p>

      <h2>5. Hak kamu</h2>
      <p>
        Sesuai prinsip perlindungan data pribadi yang berlaku di Indonesia, kamu dapat
        meminta informasi tentang data yang kami simpan, meminta koreksi, atau meminta
        penghapusan data yang kamu kirimkan kepada kami. Kirim permintaan melalui{" "}
        <Link href="/kontak">halaman kontak</Link> dengan menyebutkan jenis permintaan dan
        alamat email yang digunakan.
      </p>

      <h2>6. Keamanan</h2>
      <p>
        Kami menggunakan langkah teknis yang wajar untuk melindungi data, termasuk pembatasan
        akses dan pemisahan data katalog dari data operasional. Namun, tidak ada sistem yang
        sepenuhnya bebas risiko. Jangan mengirim informasi sensitif melalui email.
      </p>

      <h2>7. Anak-anak</h2>
      <p>
        Situs ini tidak ditujukan untuk anak di bawah usia yang diizinkan untuk menggunakan
        layanan internet secara mandiri di yurisdiksinya. Kami tidak dengan sengaja
        mengumpulkan data pribadi anak-anak. Jika kamu mengetahui adanya data seperti itu,
        hubungi kami agar dapat dihapus.
      </p>

      <h2>8. Perubahan kebijakan</h2>
      <p>
        Kebijakan ini dapat diperbarui ketika fitur, hukum, atau praktik data berubah.
        Tanggal pembaruan ditampilkan di bagian atas halaman. Perubahan material akan
        diumumkan melalui situs.
      </p>

      <h2>9. Kontak</h2>
      <p>
        Pertanyaan tentang privasi dapat dikirim melalui <Link href="/kontak">halaman
        kontak</Link>. Kami akan berusaha merespons dalam waktu yang wajar.
      </p>

      <p className="text-xs">
        Catatan: dokumen ini adalah kebijakan operasional untuk versi beta, bukan nasihat
        hukum. Sebelum peluncuran komersial, kebijakan akan ditinjau oleh penasihat hukum.
      </p>
    </LegalPage>
  );
}
