import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (!pathname.startsWith("/checkin")) return NextResponse.next();

  const allowedIPs = (process.env.CHECKIN_ALLOWED_IPS || "")
    .split(",")
    .map((ip) => ip.trim())
    .filter(Boolean);

  // If no IPs configured, redirect everyone to gate page
  if (allowedIPs.length === 0) {
    return NextResponse.redirect(new URL("/checkin-gate", req.url));
  }

  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : req.headers.get("x-real-ip") || "";
  console.log("CHECKIN IP CHECK — forwarded:", req.headers.get("x-forwarded-for"), "real-ip:", req.headers.get("x-real-ip"));

  if (!allowedIPs.includes(ip)) {
    return NextResponse.redirect(new URL("/checkin-gate", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/checkin", "/checkin/:path*"],
};
