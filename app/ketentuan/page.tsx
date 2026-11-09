import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Ketentuan Layanan",
  description:
    "Ketentuan penggunaan Nimelist: layanan informasi katalog, tanpa streaming, batasan akurasi, kekayaan intelektual, dan hukum yang berlaku.",
  alternates: { canonical: "/ketentuan" },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Ketentuan Layanan"
      description="Dengan menggunakan Nimelist, kamu setuju dengan ketentuan berikut. Bacalah sebelum menggunakan katalog atau tautan platform."
      updated="2026-11-09"
    >
      <h2>1. Tentang layanan</h2>
      <p>
        Nimelist adalah layanan informasi katalog anime. Kami menyediakan metadata,
        sinopsis, jadwal, dan tautan ke platform pihak ketiga. Kami{" "}
        <strong>tidak menyediakan, meng-host, atau mendistribusikan video anime</strong>.
        Semua tontonan terjadi di platform yang kamu pilih.
      </p>

      <h2>2. Penggunaan yang diizinkan</h2>
      <p>
        Kamu boleh menggunakan situs untuk keperluan pribadi dan non-komersial, termasuk
        mencari judul, membaca sinopsis, dan mengunjungi platform legal. Kamu tidak boleh:
      </p>
      <ul>
        <li>Mengakses situs dengan cara yang mengganggu, membebani, atau merusak layanan.</li>
        <li>Mencoba melewati pembatasan teknis atau mengakses data non-publik.</li>
        <li>Menyalin seluruh katalog secara massal untuk layanan pesaing tanpa izin.</li>
        <li>Menggunakan situs untuk menyebarkan malware, spam, atau konten ilegal.</li>
        <li>Mengklaim afiliasi dengan Nimelist tanpa persetujuan tertulis.</li>
      </ul>

      <h2>3. Akurasi informasi</h2>
      <p>
        Kami berusaha menjaga data tetap akurat, tetapi katalog dan jadwal dapat berubah.
        Jadwal yang ditandai <strong>Estimasi</strong> belum dikonfirmasi. Ketersediaan di
        platform berbeda per region dan dapat berubah tanpa pemberitahuan. Selalu
        verifikasi di platform resmi sebelum mengambil keputusan, termasuk keputusan
        berlangganan.
      </p>

      <h2>4. Tautan pihak ketiga</h2>
      <p>
        Tautan ke platform streaming dan sumber data eksternal disediakan untuk kemudahan.
        Kami tidak mengendalikan konten, harga, ketersediaan, atau kebijakan platform
        tersebut. Kunjungan ke situs pihak ketiga tunduk pada syarat dan kebijakan mereka.
      </p>

      <h2>5. Kekayaan intelektual</h2>
      <p>
        Nama, logo, tata letak, dan tulisan orisinal Nimelist adalah milik Nimelist atau
        pemberi lisensinya. Judul anime, poster, dan merek dagang adalah milik pemiliknya
        masing-masing. Data katalog dari <code>anime-offline-database</code> digunakan
        dengan lisensi ODbL-1.0; atribusi lengkap ada di{" "}
        <Link href="/hak-cipta">halaman hak cipta</Link>.
      </p>
      <p>
        Kamu tidak boleh menyalin sinopsis orisinal Nimelist secara utuh untuk diterbitkan
        ulang tanpa izin. Kutipan singkat dengan atribusi dan tautan diperbolehkan.
      </p>

      <h2>6. Batasan tanggung jawab</h2>
      <p>
        Layanan disediakan &quot;sebagaimana adanya&quot;. Sejauh diizinkan hukum, Nimelist
        tidak bertanggung jawab atas kerugian tidak langsung, kehilangan data, atau kerugian
        yang timbul dari penggunaan situs atau ketergantungan pada informasi yang tidak
        akurat. Ini tidak menghapus hak konsumen yang tidak dapat dikesampingkan menurut
        hukum yang berlaku.
      </p>

      <h2>7. Perubahan layanan</h2>
      <p>
        Kami dapat menambah, mengubah, atau menghentikan fitur kapan saja. Ketentuan ini
        dapat diperbarui; versi terbaru akan ditampilkan di halaman ini dengan tanggal
        pembaruan. Penggunaan berkelanjutan setelah perubahan berarti kamu menerima versi
        terbaru.
      </p>

      <h2>8. Hukum yang berlaku</h2>
      <p>
        Ketentuan ini diatur oleh hukum Republik Indonesia. Sengketa akan diupayakan
        diselesaikan secara musyawarah terlebih dahulu. Jika diperlukan, yurisdiksi mengikuti
        ketentuan hukum yang berlaku.
      </p>

      <h2>9. Kontak</h2>
      <p>
        Pertanyaan tentang ketentuan ini dapat dikirim melalui{" "}
        <Link href="/kontak">halaman kontak</Link>.
      </p>

      <p className="text-xs">
        Catatan: dokumen ini adalah ketentuan operasional untuk versi beta, bukan nasihat
        hukum. Dokumen akan ditinjau sebelum peluncuran komersial.
      </p>
    </LegalPage>
  );
}
