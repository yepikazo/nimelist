import Link from "next/link";
import { ExternalLink, Heart, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/logo";
import { COPYRIGHT_YEAR } from "@/lib/constants";

const EXPLORE_LINKS = [
  { href: "/anime", label: "Jelajah anime" },
  { href: "/jadwal-tayang", label: "Jadwal tayang" },
  { href: "/musim/fall-2026", label: "Musim Fall 2026" },
  { href: "/genre", label: "Semua genre" },
  { href: "/platform", label: "Platform legal" },
];

const ABOUT_LINKS = [
  { href: "/tentang", label: "Tentang Nimelist" },
  { href: "/pedoman", label: "Pedoman komunitas" },
  { href: "/kontak", label: "Kontak & koreksi" },
  { href: "/hak-cipta", label: "Hak cipta & takedown" },
];

const LEGAL_LINKS = [
  { href: "/privasi", label: "Kebijakan privasi" },
  { href: "/ketentuan", label: "Ketentuan layanan" },
  { href: "/hak-cipta", label: "Atribusi data" },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-surface/40 pb-24 md:pb-0">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-6 text-muted">
              Katalog anime berbahasa Indonesia dengan jadwal WIB, sinopsis orisinal,
              dan tautan ke platform legal. Tidak ada streaming ilegal di sini.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-medium text-muted">
                <ShieldCheck className="h-3.5 w-3.5 text-success" />
                Hanya platform legal
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-1 text-[11px] font-medium text-muted">
                <Heart className="h-3.5 w-3.5 text-brand" />
                Dibuat di Indonesia
              </span>
            </div>
          </div>

          <FooterColumn title="Jelajah" links={EXPLORE_LINKS} />
          <FooterColumn title="Tentang" links={ABOUT_LINKS} />
          <FooterColumn title="Legal" links={LEGAL_LINKS} />
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-line pt-6 text-xs leading-5 text-muted md:flex-row md:items-start md:justify-between">
          <p className="max-w-3xl">
            Data katalog sebagian berasal dari{" "}
            <a
              href="https://github.com/manami-project/anime-offline-database"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-medium text-ink underline decoration-line underline-offset-2 hover:text-brand"
            >
              anime-offline-database
              <ExternalLink className="h-3 w-3" />
            </a>{" "}
            (ODbL-1.0). Poster berasal dari sumber eksternal dan ditampilkan sebagai
            referensi; hak cipta tetap milik pemiliknya. Jadwal Fall 2026 pada versi beta
            ini bersifat estimasi.
          </p>
          <p className="shrink-0 font-mono text-[11px]">
            © {COPYRIGHT_YEAR} Nimelist · WIB (UTC+7)
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
        {title}
      </h2>
      <ul className="mt-3 space-y-2.5">
        {links.map((link) => (
          <li key={link.href + link.label}>
            <Link
              href={link.href}
              className="text-sm text-muted transition-colors hover:text-ink"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
