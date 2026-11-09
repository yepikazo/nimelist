import { permanentRedirect } from "next/navigation";

export default async function SeasonRedirectPage({
  params,
}: {
  params: Promise<{ seasonYear: string }>;
}) {
  const { seasonYear } = await params;
  permanentRedirect(`/musim/${seasonYear}`);
}
