import type { NextConfig } from "next";

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://js.stripe.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co",
  "font-src 'self'",
  // 'self' for the records page's installation embed (public/embed/).
  "frame-src 'self' https://js.stripe.com",
  "connect-src 'self' https://api.stripe.com https://*.supabase.co",
  // blob: is how hls.js plays: it attaches a MediaSource to the <video> as a
  // blob: URL. Only browsers without native HLS take that path (Firefox; Chrome
  // and Safari play it natively, which needs crossOrigin on the <video> instead).
  "media-src 'self' blob: https://*.supabase.co",
  "worker-src 'self' blob:",
].join("; ");

const SHARED_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Content-Security-Policy", value: CSP },
];

const nextConfig: NextConfig = {
  // Dev only: lets the dev server serve its own scripts to a phone on the home
  // Wi-Fi. Ignored by `next build`.
  allowedDevOrigins: ["10.0.0.69"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          ...SHARED_HEADERS,
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=()" },
        ],
      },
      {
        // Static embeds are framed by our own pages, so they relax DENY to
        // same-origin only. Listed after the catch-all: when two rules set the
        // same key, the later one wins. Every other route keeps DENY.
        source: "/embed/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Content-Security-Policy", value: `${CSP}; frame-ancestors 'self'` },
        ],
      },
    ];
  },
};

export default nextConfig;
