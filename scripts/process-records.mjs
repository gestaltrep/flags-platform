#!/usr/bin/env node
// Run: node --env-file=.env.local scripts/process-records.mjs [event-slug]
import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";
import { spawnSync } from "child_process";
import { tmpdir } from "os";
import { join, basename, extname } from "path";
import { writeFileSync, readFileSync, unlinkSync, openSync, readSync, closeSync } from "fs";
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

// ── Fast-start detection ──────────────────────────────────────────────────────
// Walk top-level MP4 box headers to check whether moov precedes mdat.
// Reads only box size+type (8 bytes per box), never the box payload.
function isFastStart(filePath) {
  const fd = openSync(filePath, "r");
  const hdr = Buffer.alloc(8);
  let pos = 0;
  try {
    while (true) {
      if (readSync(fd, hdr, 0, 8, pos) < 8) break;
      const size = hdr.readUInt32BE(0);
      const type = hdr.subarray(4, 8).toString("ascii");
      if (type === "moov") return true;
      if (type === "mdat") return false;
      if (size === 0) break; // "runs to EOF" sentinel
      if (size === 1) {
        // 64-bit extended size stored in the next 8 bytes
        const ext = Buffer.alloc(8);
        readSync(fd, ext, 0, 8, pos + 8);
        pos += ext.readUInt32BE(0) * 0x100000000 + ext.readUInt32BE(4);
      } else {
        pos += size;
      }
    }
  } finally {
    closeSync(fd);
  }
  return false; // could not determine (malformed or unknown container)
}

// ── ffprobe ───────────────────────────────────────────────────────────────────
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

  return {
    width:      vs.width,
    height:     vs.height,
    duration:   parseFloat(info.format?.duration ?? vs.duration ?? "0"),
    codec_name: vs.codec_name,
    pix_fmt:    vs.pix_fmt,
  };
}

// ── Frame extraction ──────────────────────────────────────────────────────────
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

  // Skip when every applicable step is already done.
  // Videos require faststart=true in addition to dimensions+poster.
  const derivativePresent = kind === "photo" ? !!meta.thumb_path : !!meta.poster_path;
  const faststartDone     = kind !== "video" || meta.faststart === true;

  if (width != null && height != null && derivativePresent && faststartDone) {
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
      const ext = extname(storage_path) || ".mp4";
      const tmpVideo = join(tmpdir(), `video-${randomUUID()}${ext}`);
      writeFileSync(tmpVideo, buf);
      let tmpRemuxed = null;

      try {
        const newMeta = { ...meta };
        const updFields = {};

        // ── Step 1: fast-start guarantee ──────────────────────────────
        if (newMeta.faststart !== true) {
          const probe = ffprobeVideo(tmpVideo);

          if (isFastStart(tmpVideo)) {
            newMeta.faststart = true;
            console.log(`       fast-start: ✓ already OK`);
          } else if (probe.codec_name === "h264" && probe.pix_fmt === "yuv420p") {
            tmpRemuxed = join(tmpdir(), `video-fs-${randomUUID()}${ext}`);
            const r = spawnSync(
              FFMPEG,
              ["-i", tmpVideo, "-c", "copy", "-movflags", "+faststart", "-y", tmpRemuxed],
              { encoding: "utf8" }
            );
            if (r.status !== 0) throw new Error(`faststart remux failed:\n${r.stderr}`);

            const remuxedBuf = readFileSync(tmpRemuxed);
            await uploadBuffer(remuxedBuf, storage_path, "video/mp4");
            // Replace tmpVideo with remuxed content so the poster step uses the fixed file
            writeFileSync(tmpVideo, remuxedBuf);
            newMeta.faststart = true;
            console.log(`       fast-start: remuxed + upserted (${(remuxedBuf.length / 1024 / 1024).toFixed(1)} MB)`);
          } else {
            console.log(`       fast-start: WARNING codec=${probe.codec_name} pix_fmt=${probe.pix_fmt} — not h264/yuv420p, remux skipped`);
          }
        }

        // ── Step 2: dimensions + poster ───────────────────────────────
        if (width == null || height == null || !meta.poster_path) {
          const { width: vW, height: vH, duration } = ffprobeVideo(tmpVideo);
          const seekSec = duration < 2 ? duration / 2 : 1;
          const posterBuf = await extractFrameWebp(tmpVideo, seekSec);

          const posterPath = `${EVENT_SLUG}/posters/${baseName}.webp`;
          await uploadBuffer(posterBuf, posterPath, "image/webp");

          updFields.width            = vW;
          updFields.height           = vH;
          updFields.duration_seconds = Math.round(duration);
          newMeta.poster_path        = posterPath;

          console.log(`       ${vW}×${vH}  ${duration.toFixed(3)}s  →  ${posterPath}`);
        }

        // ── Row update (always runs — at least faststart flag changed) ─
        const { error: updErr } = await supabase
          .from("records")
          .update({ ...updFields, metadata: newMeta })
          .eq("id", id);
        if (updErr) throw new Error(`Row update failed: ${updErr.message}`);

        console.log(`       [row updated]`);
        processed++;
      } finally {
        try { unlinkSync(tmpVideo); } catch { /* ignore */ }
        if (tmpRemuxed) try { unlinkSync(tmpRemuxed); } catch { /* ignore */ }
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
