export function GET() {
  return Response.json({
    status: "ok",
    service: "nimelist",
    timestamp: new Date().toISOString(),
  });
}
