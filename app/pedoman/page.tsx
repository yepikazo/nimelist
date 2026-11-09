import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Pedoman Komunitas",
  description:
    "Pedoman komunitas Nimelist: sopan, hindari spoiler, hormati hak cipta, dan cara melaporkan pelanggaran.",
  alternates: { canonical: "/pedoman" },
};

export default function GuidelinesPage() {
  return (
    <LegalPage
      title="Pedoman Komunitas"
      description="Kami ingin ruang diskusi yang nyaman untuk penonton anime Indonesia. Pedoman ini berlaku untuk fitur komunitas yang akan datang."
      updated="2026-11-09"
    >
      <h2>Status fitur komunitas</h2>
      <p>
        Versi beta Nimelist belum memiliki komentar, ulasan pengguna, atau profil publik.
        Pedoman ini disiapkan untuk fitur diskusi yang akan datang, dan juga menjadi
        pegangan untuk pesan yang kamu kirim ke tim kami.
      </p>

      <h2>1. Hormati orang lain</h2>
      <ul>
        <li>Tidak ada ujaran kebencian, pelecehan, ancaman, atau serangan pribadi.</li>
        <li>Kritik boleh tajam, tetapi tetap membahas karya, bukan menyerang penggemar.</li>
        <li>Jangan menyebarkan informasi pribadi orang lain tanpa izin.</li>
      </ul>

      <h2>2. Lindungi pengalaman menonton</h2>
      <ul>
        <li>
          Gunakan penanda spoiler untuk kejadian penting. Tulis peringatan sebelum
          membahas ending atau plot twist.
        </li>
        <li>Jangan memakai judul diskusi yang membocorkan plot utama.</li>
        <li>Hormati keinginan orang untuk menonton dengan kecepatan masing-masing.</li>
      </ul>

      <h2>3. Hormati hak cipta</h2>
      <ul>
        <li>Jangan membagikan tautan streaming ilegal, mirror, atau file bajakan.</li>
        <li>Jangan mengunggah scan, subtitle, atau poster beresolusi tinggi yang bukan hakmu.</li>
        <li>Kutipan singkat untuk diskusi boleh, dengan atribusi yang jelas.</li>
      </ul>

      <h2>4. Jangan spam atau menipu</h2>
      <ul>
        <li>Tidak ada promosi berulang, tautan afiliasi tersembunyi, atau clickbait.</li>
        <li>Jangan menyamar sebagai editor Nimelist atau perwakilan platform.</li>
        <li>Jangan mengirim laporan palsu untuk menjatuhkan judul atau pengguna lain.</li>
      </ul>

      <h2>5. Konten dewasa dan sensitif</h2>
      <p>
        Diskusi tentang judul dewasa harus diberi label dan tidak boleh menampilkan gambar
        eksplisit. Konten yang menormalisasi kekerasan seksual, eksploitasi anak, atau
        aktivitas ilegal akan dihapus dan dapat dilaporkan.
      </p>

      <h2>6. Pelanggaran dan moderasi</h2>
      <p>
        Tindakan dapat berupa peringatan, penghapusan konten, pembatasan fitur, atau
        larangan penggunaan. Kami berusaha menerapkan moderasi secara konsisten, tetapi
        keputusan dapat bergantung pada konteks. Kamu dapat meminta peninjauan ulang melalui{" "}
        <Link href="/kontak">halaman kontak</Link>.
      </p>

      <h2>7. Melaporkan masalah</h2>
      <p>
        Saat melapor, sertakan tautan, tangkapan layar jika perlu, dan penjelasan singkat
        tentang pelanggaran. Jangan menyebarkan konten yang bermasalah ke lebih banyak
        orang. Untuk masalah hak cipta, gunakan{" "}
        <Link href="/hak-cipta">halaman hak cipta</Link>.
      </p>
    </LegalPage>
  );
}
