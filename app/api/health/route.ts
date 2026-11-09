import { getSiteStats } from "@/lib/repository";

export async function GET() {
  const stats = await getSiteStats();
  return Response.json({
    status: "ok",
    service: "nimelist",
    media: stats.media,
    reviewed: stats.reviewed,
    timestamp: new Date().toISOString(),
  });
}
