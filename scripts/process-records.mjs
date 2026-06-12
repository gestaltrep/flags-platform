#!/usr/bin/env node
// Run: node --env-file=.env.local scripts/process-records.mjs [event-slug]
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { spawnSync } from "child_process";
import { tmpdir } from "os";
import { join, basename, extname } from "path";
import { writeFileSync, unlinkSync } from "fs";
import { randomUUID } from "crypto";

const EVENT_SLUG = process.argv[2] ?? "rave-initiation-2026-05";
const MAX_WIDTH = 1200;
const WEBP_QUALITY = 72;

// ── Env ───────────────────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    "ERROR: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.\n" +
    "Run with: node --env-file=.env.local scripts/process-records.mjs"
  );
  process.exit(1);
}

// ── ffmpeg / ffprobe ──────────────────────────────────────────────────────────
function findBin(name) {
  for (const cmd of ["where", "which"]) {
    const r = spawnSync(cmd, [name], { encoding: "utf8" });
    if (r.status === 0) return r.stdout.trim().split(/\r?\n/)[0].trim();
  }
  return null;
}

const FFPROBE = findBin("ffprobe");
const FFMPEG  = findBin("ffmpeg");

if (!FFPROBE || !FFMPEG) {
  const missing = [!FFPROBE && "ffprobe", !FFMPEG && "ffmpeg"].filter(Boolean).join(", ");
  console.error(
    `ERROR: ${missing} not found on PATH.\n` +
    "Install ffmpeg from https://ffmpeg.org/download.html and ensure it is on PATH."
  );
  process.exit(1);
}

console.log(`ffmpeg:  ${FFMPEG}`);
console.log(`ffprobe: ${FFPROBE}`);

// ── Supabase ──────────────────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ── Storage helpers ───────────────────────────────────────────────────────────
async function downloadToBuffer(storagePath) {
  const { data, error } = await supabase.storage.from("records").download(storagePath);
  if (error) throw new Error(`Download failed for ${storagePath}: ${error.message}`);
  return Buffer.from(await data.arrayBuffer());
}

async function uploadBuffer(buf, destPath, contentType) {
  const { error } = await supabase.storage
    .from("records")
    .upload(destPath, buf, { contentType, upsert: true });
  if (error) throw new Error(`Upload failed for ${destPath}: ${error.message}`);
}

// ── ffprobe / frame extract ───────────────────────────────────────────────────
function ffprobeVideo(filePath) {
  const r = spawnSync(
    FFPROBE,
    ["-v", "quiet", "-print_format", "json", "-show_streams", "-show_format", filePath],
    { encoding: "utf8", maxBuffer: 4 * 1024 * 1024 }
  );
  if (r.status !== 0) throw new Error(`ffprobe failed:\n${r.stderr}`);

  const info = JSON.parse(r.stdout);
  const vs = info.streams.find((s) => s.codec_type === "video");
  if (!vs) throw new Error("No video stream found");

  const duration = parseFloat(
    info.format?.duration ?? vs.duration ?? "0"
  );
  return { width: vs.width, height: vs.height, duration };
}

async function extractFrameWebp(filePath, seekSec) {
  const outPng = join(tmpdir(), `frame-${randomUUID()}.png`);
  const scaleFilter = `scale='min(${MAX_WIDTH},iw)':-2`;

  const r = spawnSync(
    FFMPEG,
    ["-ss", String(seekSec), "-i", filePath, "-vframes", "1", "-vf", scaleFilter, "-y", outPng],
    { encoding: "utf8" }
  );
  if (r.status !== 0) throw new Error(`ffmpeg frame extract failed:\n${r.stderr}`);

  const webpBuf = await sharp(outPng).webp({ quality: WEBP_QUALITY }).toBuffer();
  try { unlinkSync(outPng); } catch { /* ignore */ }
  return webpBuf;
}

// ── Main ──────────────────────────────────────────────────────────────────────
const { data: event, error: eventErr } = await supabase
  .from("events")
  .select("id, slug")
  .eq("slug", EVENT_SLUG)
  .maybeSingle();

if (eventErr || !event) {
  console.error(`ERROR: Event '${EVENT_SLUG}' not found.${eventErr ? " " + eventErr.message : ""}`);
  process.exit(1);
}

const { data: records, error: recErr } = await supabase
  .from("records")
  .select("id, kind, storage_path, width, height, metadata")
  .eq("event_id", event.id)
  .order("display_order", { ascending: true })
  .order("created_at", { ascending: true });

if (recErr) {
  console.error("ERROR fetching records:", recErr.message);
  process.exit(1);
}

console.log(`\nEvent : ${EVENT_SLUG}`);
console.log(`Records: ${records.length}\n`);

let processed = 0;
let skipped = 0;
let failed = 0;

for (const record of records) {
  const { id, kind, storage_path, width, height, metadata } = record;
  const meta = metadata ?? {};
  const baseName = basename(storage_path, extname(storage_path));

  const derivativePresent = kind === "photo" ? meta.thumb_path : meta.poster_path;
  if (width != null && height != null && derivativePresent) {
    console.log(`[SKIP] ${storage_path}`);
    skipped++;
    continue;
  }

  console.log(`[PROC] ${storage_path} (${kind})`);

  try {
    if (kind === "photo") {
      const buf = await downloadToBuffer(storage_path);

      const { width: origW, height: origH } = await sharp(buf).metadata();

      const thumbBuf = await sharp(buf)
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();

      const thumbPath = `${EVENT_SLUG}/thumbs/${baseName}.webp`;
      await uploadBuffer(thumbBuf, thumbPath, "image/webp");

      const { error: updErr } = await supabase
        .from("records")
        .update({ width: origW, height: origH, metadata: { ...meta, thumb_path: thumbPath } })
        .eq("id", id);
      if (updErr) throw new Error(`Row update failed: ${updErr.message}`);

      console.log(`       ${origW}×${origH}  →  ${thumbPath}  [row updated]`);
      processed++;

    } else if (kind === "video") {
      const buf = await downloadToBuffer(storage_path);
      const tmpVideo = join(tmpdir(), `video-${randomUUID()}${extname(storage_path) || ".mp4"}`);
      writeFileSync(tmpVideo, buf);

      try {
        const { width: vW, height: vH, duration } = ffprobeVideo(tmpVideo);
        const seekSec = duration < 2 ? duration / 2 : 1;
        const posterBuf = await extractFrameWebp(tmpVideo, seekSec);

        const posterPath = `${EVENT_SLUG}/posters/${baseName}.webp`;
        await uploadBuffer(posterBuf, posterPath, "image/webp");

        const { error: updErr } = await supabase
          .from("records")
          .update({
            width: vW,
            height: vH,
            duration_seconds: Math.round(duration),
            metadata: { ...meta, poster_path: posterPath },
          })
          .eq("id", id);
        if (updErr) throw new Error(`Row update failed: ${updErr.message}`);

        console.log(`       ${vW}×${vH}  ${duration.toFixed(3)}s  →  ${posterPath}  [row updated]`);
        processed++;
      } finally {
        try { unlinkSync(tmpVideo); } catch { /* ignore */ }
      }

    } else {
      console.log(`       ! unknown kind '${kind}' — skipped`);
      skipped++;
    }
  } catch (err) {
    console.error(`       ✗ FAILED: ${err.message}`);
    failed++;
  }
}

console.log(`\n── Summary ────────────────────────────`);
console.log(`  processed : ${processed}`);
console.log(`  skipped   : ${skipped}`);
console.log(`  failed    : ${failed}`);
console.log(`────────────────────────────────────────`);
if (failed > 0) process.exit(1);
