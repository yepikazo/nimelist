import { Breadcrumbs } from "@/components/breadcrumbs";
import { formatDateShort } from "@/lib/utils";

export function LegalPage({
  title,
  description,
  updated = "2026-11-09",
  children,
}: {
  title: string;
  description: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <Breadcrumbs items={[{ label: "Beranda", href: "/" }, { label: title }]} />
      <header className="mt-6 border-b border-line pb-6">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-brand">
          Informasi
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.04em] text-ink sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{description}</p>
        <p className="mt-3 font-mono text-[11px] text-muted/80">
          Terakhir diperbarui: {formatDateShort(updated)}
        </p>
      </header>
      <div className="legal-prose mt-6">{children}</div>
    </div>
  );
}
