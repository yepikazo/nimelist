import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageSquareWarning, ShieldAlert } from "lucide-react";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Kontak & Koreksi Data",
  description:
    "Hubungi Nimelist untuk koreksi data anime, laporan tautan bermasalah, pertanyaan editorial, atau permintaan takedown hak cipta.",
  alternates: { canonical: "/kontak" },
};

const CONTACT_EMAIL = "halo@nimelist.id";

export default function ContactPage() {
  return (
    <LegalPage
      title="Kontak & Koreksi Data"
      description="Menemukan jadwal yang salah, tautan bermasalah, atau informasi yang perlu diperbarui? Beri tahu kami."
      updated="2026-11-09"
    >
      <div className="not-prose grid gap-2.5 sm:grid-cols-3">
        <a
          href={`mailto:${CONTACT_EMAIL}?subject=Koreksi%20data%20Nimelist`}
          className="group rounded-2xl border border-line bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-card"
        >
          <Mail className="h-5 w-5 text-brand" />
          <p className="mt-3 text-sm font-bold text-ink">Koreksi data</p>
          <p className="mt-1 text-[11px] leading-5 text-muted">
            Judul, jadwal, studio, genre, atau tautan yang keliru.
          </p>
        </a>
        <a
          href={`mailto:${CONTACT_EMAIL}?subject=Laporan%20tautan%20bermasalah`}
          className="group rounded-2xl border border-line bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-card"
        >
          <MessageSquareWarning className="h-5 w-5 text-amber" />
          <p className="mt-3 text-sm font-bold text-ink">Laporkan tautan</p>
          <p className="mt-1 text-[11px] leading-5 text-muted">
            Tautan mati, salah arah, atau mengarah ke layanan ilegal.
          </p>
        </a>
        <a
          href={`mailto:${CONTACT_EMAIL}?subject=Takedown%20hak%20cipta`}
          className="group rounded-2xl border border-line bg-surface p-4 transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-card"
        >
          <ShieldAlert className="h-5 w-5 text-danger" />
          <p className="mt-3 text-sm font-bold text-ink">Hak cipta</p>
          <p className="mt-1 text-[11px] leading-5 text-muted">
            Permintaan takedown poster atau materi berhak cipta.
          </p>
        </a>
      </div>

      <h2>Email</h2>
      <p>
        <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold">
          {CONTACT_EMAIL}
        </a>
      </p>
      <p>
        Alamat ini adalah kanal resmi untuk versi beta. Sertakan URL halaman Nimelist yang
        relevan agar kami dapat memeriksa lebih cepat.
      </p>

      <h2>Apa yang perlu disertakan</h2>
      <ul>
        <li>URL halaman anime atau jadwal yang bermasalah.</li>
        <li>Data yang salah dan data yang seharusnya.</li>
        <li>Sumber pendukung, misalnya situs resmi atau platform, bila ada.</li>
        <li>Untuk takedown: bukti kepemilikan atau kewenangan atas materi.</li>
      </ul>

      <h2>Yang tidak dapat kami bantu</h2>
      <ul>
        <li>Permintaan tautan streaming ilegal atau file episode.</li>
        <li>Permintaan untuk mengubah skor pengguna di platform lain.</li>
        <li>Masalah akun atau pembayaran di platform pihak ketiga—hubungi platformnya langsung.</li>
      </ul>

      <h2>Waktu respons</h2>
      <p>
        Kami membaca laporan secara berkala. Selama masa beta, respons dapat memakan waktu
        beberapa hari. Laporan yang menyertakan tautan dan sumber yang jelas akan
        diprioritaskan. Untuk kebijakan data dan hak cipta, lihat{" "}
        <Link href="/hak-cipta">halaman hak cipta</Link> dan{" "}
        <Link href="/privasi">kebijakan privasi</Link>.
      </p>
    </LegalPage>
  );
}
