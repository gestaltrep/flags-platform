import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  // Auth: same cookie check as app/records/[event-slug]/page.tsx
  const cookieStore = await cookies();
  if (!cookieStore.get("user_id")?.value) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { path: segments } = await params;

  // Reject traversal
  if (segments.some((s) => s === "..")) {
    return new Response("Not Found", { status: 404 });
  }

  const objectKey = segments.join("/");

  // Only serve .m3u8 files that live under an /hls/ prefix
  if (!objectKey.includes("/hls/") || !objectKey.endsWith(".m3u8")) {
    return new Response("Not Found", { status: 404 });
  }

  const supabase = serviceClient();

  const { data: blob, error } = await supabase.storage
    .from("records")
    .download(objectKey);

  if (error || !blob) {
    return new Response("Not Found", { status: 404 });
  }

  const text = await blob.text();
  const lines = text.split("\n");
  // Directory containing this playlist — used to build sibling paths
  const dir = segments.slice(0, -1).join("/");

  // Collect all .ts lines so we can sign them in a single batch call
  const tsIndices: number[] = [];
  const tsPaths: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.endsWith(".ts")) {
      tsIndices.push(i);
      tsPaths.push(`${dir}/${trimmed}`);
    }
  }

  let signedUrls: string[] = [];
  if (tsPaths.length > 0) {
    const { data: signed } = await supabase.storage
      .from("records")
      .createSignedUrls(tsPaths, 10800);
    signedUrls = (signed ?? []).map((s) => s.signedUrl);
  }

  // Rewrite URI lines; everything else passes through verbatim
  const tsIndexSet = new Set(tsIndices);
  let tsIdx = 0;
  const output = lines.map((line, i) => {
    const trimmed = line.trim();
    if (tsIndexSet.has(i)) {
      // Segment: replace with 3-hour signed Supabase URL
      return signedUrls[tsIdx++] ?? trimmed;
    }
    if (trimmed.endsWith(".m3u8")) {
      // Variant ref in master: route back through this handler
      return `/api/hls/${dir}/${trimmed}`;
    }
    return line;
  });

  return new Response(output.join("\n"), {
    headers: {
      "Content-Type": "application/vnd.apple.mpegurl",
      "Cache-Control": "no-store",
    },
  });
}
