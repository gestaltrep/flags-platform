#!/usr/bin/env node
// Run: node scripts/build-records-preview.mjs
//
// Builds the RAVE_Exp_1 records gallery on local disk, exactly as it would be
// uploaded, and writes the manifest that both the local preview and the eventual
// production insert read. Nothing here touches Supabase.
//
// Layout mirrors the `records` bucket: a row's storage_path, thumb_path and
// poster_path resolve to public/records-preview/<that path>. Derivative settings
// are process-records.mjs's: 1200px-wide WebP at q72, poster frame at 1s (or
// half the duration under 2s), and a faststart MP4.
import sharp from "sharp";
import { spawnSync } from "child_process";
import { createHash } from "crypto";
import { mkdirSync, copyFileSync, readFileSync, writeFileSync, unlinkSync, openSync, readSync, closeSync, statSync, readdirSync, existsSync } from "fs";
import { join, basename, extname, relative } from "path";
import { makeHls } from "./make-hls.mjs";

const SLUG = "rave-exp-1-2026-09";
const EVENT_ID = "f8850950-1658-48d2-9952-c9c33fd14d23";
// The one account on every RAVE_Initiation record row.
const UPLOADED_BY = "e044c45b-fdc4-4fd3-aa02-b9b76c3bdc38";
const LAB = "C:/Users/12395/Desktop/SRG/RAVE_Exp_1.html/Promotion/LOVE/Instagram/EXP_1 COMPLETE";
const SRC_PHOTOS = join(LAB, "Records");
const SRC_VIDEO = join(LAB, "Videos", "JuLo.MOV");
// The second source: everything in RecordsResults goes on the page as well.
const RESULTS = "C:/Users/12395/Desktop/SRG/RAVE_Exp_1.html/Records/Results";
const ROOT = "public/records-preview";
const MAX_WIDTH = 1200;
const WEBP_QUALITY = 72;

// Enoch's captions, exactly as written. Everything not listed is blank. The
// Results photos and the videos carry theirs further down.
const CAPTIONS = {
  "sunken-frequencies.jpg": "SUNKEN FREQUENCIES",
  "julo.jpg": "JuLo",
  "lemon-tech.jpg": "LEMON TECH",
  "dada-cricket.jpg": "DADA CRICKET",
  "oxidose.jpg": "OXIDOSE",
  "jugglers.jpg": "JUGGLERS",
  "headliner.jpg": "HEADLINER",
  "rabbit.jpg": "REDACTED",
  "juggler.jpg": "JUGGLER",
  "mannequin.jpg": "REDACTED",
};

// In the Lab's order.json but left out of the gallery, on Enoch's call. The
// remaining rows keep their display_order, so the gaps are deliberate.
const EXCLUDED = new Set(["room-2.jpg", "room-5.jpg"]);

const local = (p) => join(ROOT, p);
const sha256 = (p) => createHash("sha256").update(readFileSync(p)).digest("hex");

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
  if (r.status !== 0) throw new Error(`${cmd} failed:\n${r.stderr}`);
  return r.stdout;
}

// Same box walk as process-records.mjs: moov before mdat.
function isFastStart(filePath) {
  const fd = openSync(filePath, "r");
  const hdr = Buffer.alloc(8);
  let pos = 0;
  try {
    while (readSync(fd, hdr, 0, 8, pos) === 8) {
      const size = hdr.readUInt32BE(0);
      const type = hdr.subarray(4, 8).toString("ascii");
      if (type === "moov") return true;
      if (type === "mdat") return false;
      if (size === 0) break;
      if (size === 1) {
        const ext = Buffer.alloc(8);
        readSync(fd, ext, 0, 8, pos + 8);
        pos += ext.readUInt32BE(0) * 0x100000000 + ext.readUInt32BE(4);
      } else pos += size;
    }
  } finally {
    closeSync(fd);
  }
  return false;
}

mkdirSync(local(`${SLUG}/thumbs`), { recursive: true });
mkdirSync(local(`${SLUG}/posters`), { recursive: true });

const order = JSON.parse(readFileSync(join(SRC_PHOTOS, "order.json"), "utf8"));
const rows = [];
const files = {};
const note = (p) => { files[p] = { bytes: statSync(local(p)).size, sha256: sha256(local(p)) }; };

for (const p of [...order.photos].sort((a, b) => a.display_order - b.display_order)) {
  if (EXCLUDED.has(p.file)) continue;
  const storagePath = `${SLUG}/${p.file}`;
  copyFileSync(join(SRC_PHOTOS, p.file), local(storagePath));
  const buf = readFileSync(local(storagePath));
  const { width, height } = await sharp(buf).metadata();

  const thumbPath = `${SLUG}/thumbs/${basename(p.file, extname(p.file))}.webp`;
  await sharp(buf)
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toFile(local(thumbPath));

  note(storagePath);
  note(thumbPath);
  rows.push({
    event_id: EVENT_ID,
    kind: "photo",
    storage_path: storagePath,
    caption: CAPTIONS[p.file] ?? null,
    display_order: p.display_order * 10,
    mime_type: "image/jpeg",
    file_size_bytes: buf.length,
    width,
    height,
    duration_seconds: null,
    metadata: { thumb_path: thumbPath },
    uploaded_by_user: UPLOADED_BY,
  });
}

// ── Results photos: HEIC → full-resolution JPEG ───────────────────────────────
// sharp's build cannot decode HEVC, so ffmpeg composes the tile grid (and applies
// any rotation). The pixels are left as they are and the source's own ICC
// profile (Display P3 on these) is embedded, so nothing is clipped; the WebP
// thumbnail is then colour-managed down to sRGB by sharp. EXIF is not carried.
function embedIcc(jpeg, icc) {
  if (icc.length > 65519) throw new Error("ICC profile needs more than one APP2 segment");
  const head = Buffer.concat([Buffer.from("ICC_PROFILE\0", "latin1"), Buffer.from([1, 1])]);
  const seg = Buffer.alloc(4);
  seg.writeUInt16BE(0xffe2, 0);
  seg.writeUInt16BE(2 + head.length + icc.length, 2);
  return Buffer.concat([jpeg.subarray(0, 2), seg, head, icc, jpeg.subarray(2)]);
}

let order10 = Math.max(...rows.map((r) => r.display_order));
const next = () => (order10 += 10);

for (const [src, name] of [["Boy1.HEIC", "boy-1"], ["Boy2.HEIC", "boy-2"]]) {
  const storagePath = `${SLUG}/${name}.jpg`;
  const tmp = join(ROOT, "heic-tmp.png");
  run("ffmpeg", ["-v", "error", "-y", "-i", join(RESULTS, src), "-frames:v", "1", "-update", "1", tmp]);
  const { icc } = await sharp(join(RESULTS, src)).metadata();
  let jpeg = await sharp(tmp).jpeg({ quality: 95, chromaSubsampling: "4:4:4" }).toBuffer();
  if (icc) jpeg = embedIcc(jpeg, icc);
  writeFileSync(local(storagePath), jpeg);
  unlinkSync(tmp);
  const { width, height } = await sharp(jpeg).metadata();

  const thumbPath = `${SLUG}/thumbs/${name}.webp`;
  await sharp(jpeg)
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toFile(local(thumbPath));

  note(storagePath);
  note(thumbPath);
  rows.push({
    event_id: EVENT_ID,
    kind: "photo",
    storage_path: storagePath,
    caption: "BOY",
    display_order: next(),
    mime_type: "image/jpeg",
    file_size_bytes: jpeg.length,
    width,
    height,
    duration_seconds: null,
    metadata: { thumb_path: thumbPath },
    uploaded_by_user: UPLOADED_BY,
  });
}

// ── Videos ────────────────────────────────────────────────────────────────────
// [source, bucket name, caption, options]. This is the page order: by artist in exhibit
// order with the original JuLo clip first in its group, then room and crowd.
// A name never reuses a photo's (room-1.jpg, jugglers.jpg), hence "-video".
const SF = "SUNKEN FREQUENCIES", JULO = "JuLo", LT = "LEMON TECH", DC = "DADA CRICKET", OX = "OXIDOSE";
const VIDEOS = [
  [join(RESULTS, "SF1.MOV"), "sunken-frequencies-1", SF],
  [join(RESULTS, "SF2.MOV"), "sunken-frequencies-2", SF],
  [join(RESULTS, "SF3.MOV"), "sunken-frequencies-3", SF],
  [join(RESULTS, "SF4.MOV"), "sunken-frequencies-4", SF],
  [SRC_VIDEO, "julo", JULO],
  [join(RESULTS, "JuLo1.MP4"), "julo-1", JULO],
  [join(RESULTS, "JuLo2.MOV"), "julo-2", JULO],
  [join(RESULTS, "JuLo3.MOV"), "julo-3", JULO],
  [join(RESULTS, "JuLo4.MOV"), "julo-4", JULO],
  [join(RESULTS, "LemonTech1.MOV"), "lemon-tech-1", LT],
  [join(RESULTS, "LemonTech2.MOV"), "lemon-tech-2", LT],
  [join(RESULTS, "LemonTech3.MOV"), "lemon-tech-3", LT],
  [join(RESULTS, "LemonTech4.MOV"), "lemon-tech-4", LT],
  // Shot as Room2, but it is Lemon Tech's set, so it is named and placed as theirs.
  [join(RESULTS, "Room2.MOV"), "lemon-tech-5", LT],
  [join(RESULTS, "DadaCricket1.MOV"), "dada-cricket-1", DC],
  [join(RESULTS, "DadaCricket2.MOV"), "dada-cricket-2", DC],
  [join(RESULTS, "DadaCricket3.MOV"), "dada-cricket-3", DC],
  // Four minutes long, so it streams: an HLS ladder beside the MP4, as footage-9 has.
  [join(RESULTS, "DadaCricket4.MP4"), "dada-cricket-4", DC, { hls: true }],
  [join(RESULTS, "Oxidose1.MOV"), "oxidose-1", OX],
  [join(RESULTS, "Oxidose2.MOV"), "oxidose-2", OX],
  [join(RESULTS, "Oxidose3.MOV"), "oxidose-3", OX],
  [join(RESULTS, "Oxidose4.MOV"), "oxidose-4", OX],
  [join(RESULTS, "Oxidose5.MOV"), "oxidose-5", OX],
  [join(RESULTS, "Faster.MOV"), "faster", null],
  [join(RESULTS, "Interact.MOV"), "interact", null],
  [join(RESULTS, "Jugglers.MOV"), "jugglers-video", "JUGGLERS"],
  [join(RESULTS, "Room1.MOV"), "room-1-video", null],
];

function probe(file) {
  const j = JSON.parse(run("ffprobe", ["-v", "quiet", "-print_format", "json", "-show_streams", "-show_format", file]));
  const v = j.streams.find((x) => x.codec_type === "video");
  const rotation = (v.side_data_list ?? []).find((d) => "rotation" in d)?.rotation ?? 0;
  const turned = Math.abs(rotation) === 90 || Math.abs(rotation) === 270;
  return {
    codec: v.codec_name,
    width: v.width,
    height: v.height,
    rotation,
    // What a player shows, i.e. after the rotation is applied.
    displayWidth: turned ? v.height : v.width,
    displayHeight: turned ? v.width : v.height,
    duration: parseFloat(j.format.duration),
    streams: j.streams.map((x) => `${x.codec_type}:${x.codec_name}`),
  };
}

// Remuxing is fast but the transcode is not, so an output is reused while its
// source's size and mtime are unchanged.
const CACHE = join(ROOT, ".build-cache.json");
let cache = {};
try { cache = JSON.parse(readFileSync(CACHE, "utf8")); } catch { /* first run */ }

const report = [];
for (const [src, name, caption, options = {}] of VIDEOS) {
  const storagePath = `${SLUG}/${name}.mp4`;
  const out = local(storagePath);
  const st = statSync(src);
  const key = `${st.size}:${st.mtimeMs}`;
  const srcProbe = probe(src);
  // Stream copy wherever a browser can already play it: H.264 at 1080p or below.
  const remux = srcProbe.codec === "h264" && Math.max(srcProbe.width, srcProbe.height) <= 1920;

  let exists = false;
  try { exists = statSync(out).size > 0; } catch { /* not built */ }
  if (!exists || cache[storagePath] !== key) {
    if (remux) {
      // First video + first audio only, which drops the iPhone's data tracks.
      // All container metadata goes (the MOVs carry GPS); the display matrix
      // that holds the rotation is stream side data and survives a copy.
      run("ffmpeg", ["-v", "error", "-y", "-i", src, "-map", "0:v:0", "-map", "0:a:0?", "-c", "copy",
        "-map_metadata", "-1", "-movflags", "+faststart", out]);
    } else {
      // The one that cannot be copied (HEVC, 5.3K). H.264 High at 1080p, capped
      // at the ~10 Mbps RAVE_Initiation's footage-9 was exported at; AAC copied.
      run("ffmpeg", ["-v", "error", "-y", "-i", src, "-map", "0:v:0", "-map", "0:a:0?",
        "-vf", "scale=1920:1080:flags=lanczos:in_range=pc:out_range=tv,format=yuv420p",
        "-c:v", "libx264", "-preset", "slow", "-profile:v", "high", "-level", "4.1",
        "-crf", "18", "-maxrate", "10M", "-bufsize", "20M",
        "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709", "-color_range", "tv",
        "-c:a", "copy", "-map_metadata", "-1", "-movflags", "+faststart", out]);
    }
    cache[storagePath] = key;
    writeFileSync(CACHE, JSON.stringify(cache, null, 2));
  }
  if (!isFastStart(out)) throw new Error(`${storagePath} is not faststart`);

  const p = probe(out);
  if (p.displayWidth * srcProbe.displayHeight !== p.displayHeight * srcProbe.displayWidth) {
    throw new Error(`${storagePath}: orientation changed (${srcProbe.displayWidth}x${srcProbe.displayHeight} -> ${p.displayWidth}x${p.displayHeight})`);
  }

  const posterPath = `${SLUG}/posters/${name}.webp`;
  const tmpPng = join(ROOT, "poster-tmp.png");
  run("ffmpeg", ["-v", "error", "-y", "-ss", String(p.duration < 2 ? p.duration / 2 : 1), "-i", out,
    "-vframes", "1", "-vf", `scale='min(${MAX_WIDTH},iw)':-2`, tmpPng]);
  await sharp(tmpPng).webp({ quality: WEBP_QUALITY }).toFile(local(posterPath));
  unlinkSync(tmpPng);

  note(storagePath);
  note(posterPath);

  // The ladder is built from the prepared MP4 (scripts/make-hls.mjs), into the
  // same place under the slug that footage-9's has in the bucket.
  let hls = null;
  if (options.hls) {
    const hlsDir = `${SLUG}/hls/${name}`;
    const hlsKey = `${key}:${statSync(out).size}`;
    if (!existsSync(local(`${hlsDir}/master.m3u8`)) || cache[`${hlsDir}/`] !== hlsKey) {
      makeHls(out, local(hlsDir));
      cache[`${hlsDir}/`] = hlsKey;
      writeFileSync(CACHE, JSON.stringify(cache, null, 2));
    }
    for (const f of readdirSync(local(hlsDir)).sort()) note(`${hlsDir}/${f}`);
    hls = { master: `${hlsDir}/master.m3u8` };
  }

  rows.push({
    event_id: EVENT_ID,
    kind: "video",
    storage_path: storagePath,
    caption,
    display_order: next(),
    mime_type: "video/mp4",
    file_size_bytes: statSync(out).size,
    // As displayed, not as coded: a portrait clip is 1080x1920 here even though
    // its stream is 1920x1080 with a -90 rotation. The page reserves the tile
    // from these before the video loads.
    width: p.displayWidth,
    height: p.displayHeight,
    duration_seconds: Math.round(p.duration),
    // footage-9's shape: the MP4 stays as storage_path and hls.master names the ladder.
    metadata: { ...(hls ? { hls } : {}), faststart: true, poster_path: posterPath },
    uploaded_by_user: UPLOADED_BY,
  });
  report.push(`${(name + ".mp4").padEnd(28)} ${remux ? "remux    " : "TRANSCODE"} ${`${p.displayWidth}x${p.displayHeight}`.padEnd(10)} rot ${String(p.rotation).padStart(3)} ${p.duration.toFixed(2).padStart(7)}s ${p.streams.join(",").padEnd(22)} ${statSync(out).size}`);
}

// Anything left in the folder that the manifest does not list is from an older
// build (a renamed or dropped file), so it goes: disk and manifest stay one set.
const walk = (dir) => readdirSync(dir, { withFileTypes: true })
  .flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
for (const f of walk(local(SLUG))) {
  const rel = relative(ROOT, f).replaceAll("\\", "/");
  if (rel !== `${SLUG}/manifest.json` && !files[rel]) {
    unlinkSync(f);
    console.log(`pruned ${rel}`);
  }
}

const manifest = {
  note: "The RAVE_Exp_1 records rows, exactly as they would be inserted. Paths are bucket paths in `records`; locally they resolve under public/records-preview/. `files` is every object to upload, with its size and SHA-256.",
  generated: new Date().toISOString(),
  event_slug: SLUG,
  rows,
  files,
};
writeFileSync(local(`${SLUG}/manifest.json`), JSON.stringify(manifest, null, 2) + "\n");

console.log(report.join("\n"));
console.log(`rows ${rows.length}, objects ${Object.keys(files).length}, bytes ${Object.values(files).reduce((a, f) => a + f.bytes, 0)}`);
