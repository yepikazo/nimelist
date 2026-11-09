import { redirect } from "next/navigation";

export default async function SearchRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const raw = params.q;
  const q = (Array.isArray(raw) ? raw[0] : raw)?.trim();
  redirect(q ? `/anime?q=${encodeURIComponent(q)}` : "/anime");
}
