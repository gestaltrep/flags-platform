import { readFile } from "fs/promises";
import { join } from "path";

/**
 * DEV ONLY. Loaded by the records page solely behind
 * `process.env.NODE_ENV !== "production" && process.env.RECORDS_PREVIEW === "1"`,
 * so a production build never imports it.
 *
 * Reads an event's rows from public/records-preview/<slug>/manifest.json (built by
 * scripts/build-records-preview.mjs) and points each one at the local copy of
 * its media instead of a signed Supabase URL. The manifest's paths are bucket
 * paths, so the same file drives the eventual insert. Returns null when the
 * event has no manifest, which leaves the page on its normal Supabase path.
 */

type ManifestRow = {
  kind: string;
  storage_path: string;
  caption: string | null;
  display_order: number | null;
  mime_type: string | null;
  width: number | null;
  height: number | null;
  metadata: Record<string, unknown> | null;
};

export async function loadRecordsPreview(slug: string) {
  let raw: string;
  try {
    raw = await readFile(join(process.cwd(), "public", "records-preview", slug, "manifest.json"), "utf8");
  } catch {
    return null;
  }
  const rows = (JSON.parse(raw).rows as ManifestRow[])
    .slice()
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
  const url = (p: string) => `/records-preview/${p}`;

  return rows.map((row, index) => {
    const meta = (row.metadata ?? {}) as Record<string, string>;
    return {
      record: { ...row, id: row.storage_path, created_at: "" },
      signedUrl: url(row.kind === "photo" ? (meta.thumb_path ?? row.storage_path) : row.storage_path),
      signedPosterUrl: meta.poster_path ? url(meta.poster_path) : null,
      index,
    };
  });
}
