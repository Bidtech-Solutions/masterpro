/** Health check container frontend (Dockerfile HEALTHCHECK). Diblokir dari publik oleh Traefik. */
export const dynamic = "force-static";

export function GET() {
  return Response.json({ status: "ok" });
}
