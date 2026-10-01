#!/usr/bin/env node
// Run: node scripts/make-hls.mjs <input.mp4> <output-dir>
//
// Builds an HLS ladder from one MP4, laid out the way the records page and
// /api/hls expect: <output-dir>/master.m3u8, one playlist per rung
// (1080p.m3u8, ...) and that rung's MPEG-TS segments (1080p_000.ts, ...).
//
// The recipe is RAVE_Initiation's footage-9, read back off its segments' x264
// settings: ABR 8000/3000/1000 kbps with maxrate 1.07x and a 1.5x buffer, High
// profile at level 4.0 (1080p) and 3.1 (720p, 480p), a keyframe every 60 frames
// with scene-cut off so every rung cuts at the same frames, x264 veryfast,
// AAC-LC 128 kbps 48 kHz stereo, and 6 second VOD segments flagged independent.
//
// A rung taller than the source is skipped rather than upscaled. Nothing here
// touches Supabase; uploading the ladder is a separate step.
import { spawnSync } from "child_process";
import { mkdirSync, readdirSync, rmSync, statSync } from "fs";
import { join, resolve } from "path";
import { pathToFileURL } from "url";

export const RUNGS = [
  { name: "1080p", height: 1080, kbps: 8000, level: "4.0" },
  { name: "720p", height: 720, kbps: 3000, level: "3.1" },
  { name: "480p", height: 480, kbps: 1000, level: "3.1" },
];
const SEGMENT_SECONDS = 6;
const GOP = 60;

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`${cmd} failed:\n${r.stderr}`);
  return r.stdout;
}

/** Encodes the ladder into outDir (emptied first) and returns what it wrote. */
export function makeHls(input, outDir) {
  const info = JSON.parse(run("ffprobe", ["-v", "quiet", "-print_format", "json", "-show_streams", input]));
  const v = info.streams.find((s) => s.codec_type === "video");
  if (!v) throw new Error(`${input}: no video stream`);
  const hasAudio = info.streams.some((s) => s.codec_type === "audio");
  const rotation = (v.side_data_list ?? []).find((d) => "rotation" in d)?.rotation ?? 0;
  // ffmpeg applies the rotation before the filters, so rungs are picked by the
  // height a viewer sees.
  const shownHeight = Math.abs(rotation) === 90 || Math.abs(rotation) === 270 ? v.width : v.height;
  const rungs = RUNGS.filter((r) => r.height <= shownHeight);
  if (rungs.length === 0) rungs.push({ ...RUNGS[RUNGS.length - 1], height: shownHeight });

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  const split = rungs.map((_, i) => `[s${i}]`).join("");
  const scales = rungs.map((r, i) => `[s${i}]scale=-2:${r.height}:flags=lanczos[v${i}]`).join(";");
  const args = ["-v", "error", "-y", "-i", input, "-filter_complex", `[0:v]split=${rungs.length}${split};${scales}`];
  rungs.forEach((r, i) => {
    args.push("-map", `[v${i}]`);
    if (hasAudio) args.push("-map", "0:a:0");
    args.push(
      `-c:v:${i}`, "libx264", `-preset:v:${i}`, "veryfast", `-profile:v:${i}`, "high", `-level:v:${i}`, r.level,
      `-b:v:${i}`, `${r.kbps}k`, `-maxrate:v:${i}`, `${Math.round(r.kbps * 1.07)}k`, `-bufsize:v:${i}`, `${Math.round(r.kbps * 1.5)}k`,
    );
  });
  args.push("-pix_fmt", "yuv420p", "-g", String(GOP), "-keyint_min", String(GOP), "-sc_threshold", "0");
  if (hasAudio) args.push("-c:a", "aac", "-b:a", "128k", "-ar", "48000", "-ac", "2");
  args.push(
    "-map_metadata", "-1",
    "-f", "hls", "-hls_time", String(SEGMENT_SECONDS), "-hls_playlist_type", "vod",
    "-hls_flags", "independent_segments", "-hls_segment_type", "mpegts",
    "-hls_segment_filename", join(outDir, "%v_%03d.ts"),
    "-master_pl_name", "master.m3u8",
    "-var_stream_map", rungs.map((r, i) => `v:${i}${hasAudio ? `,a:${i}` : ""},name:${r.name}`).join(" "),
    join(outDir, "%v.m3u8"),
  );
  run("ffmpeg", args);

  const files = readdirSync(outDir).sort();
  return {
    rungs: rungs.map((r) => r.name),
    files,
    bytes: files.reduce((a, f) => a + statSync(join(outDir, f)).size, 0),
    largest: Math.max(...files.map((f) => statSync(join(outDir, f)).size)),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [input, outDir] = process.argv.slice(2);
  if (!input || !outDir) {
    console.error("Usage: node scripts/make-hls.mjs <input.mp4> <output-dir>");
    process.exit(1);
  }
  const r = makeHls(input, outDir);
  console.log(`${r.rungs.join(", ")}: ${r.files.length} files, ${r.bytes} bytes, largest ${r.largest} bytes -> ${outDir}`);
}
