import { readFile } from "fs/promises";
import { join, normalize, sep } from "path";

/**
 * DEV ONLY. Imported by the HLS route solely behind
 * `process.env.NODE_ENV !== "production" && process.env.RECORDS_PREVIEW === "1"`,
 * so a production build never includes it.
 *
 * The local stand-in for the `records` bucket: returns the playlist at
 * public/records-preview/<objectKey> (built by scripts/build-records-preview.mjs),
 * or null when there is none, which leaves the route on Supabase. The route then
 * rewrites the playlist exactly as it does in production, with local segment
 * URLs where the signed ones would go.
 */
export async function readLocalPlaylist(objectKey: string): Promise<string | null> {
  const root = join(process.cwd(), "public", "records-preview");
  const file = normalize(join(root, objectKey));
  if (!file.startsWith(root + sep)) return null;
  try {
    return await readFile(file, "utf8");
  } catch {
    return null;
  }
}
