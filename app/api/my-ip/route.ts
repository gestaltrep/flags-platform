import { headers } from "next/headers";

export async function GET() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  const realIp = h.get("x-real-ip");
  const ip = forwarded ? forwarded.split(",")[0].trim() : realIp || "unknown";
  return Response.json({ ip, forwarded, realIp });
}
