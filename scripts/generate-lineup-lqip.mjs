import sharp from "sharp";
import { statSync } from "fs";

const SOURCE = "public/lineup_hero.png";
const OUTPUT = "public/lineup_hero_lqip.webp";
const TARGET_WIDTH = 400;
const QUALITY = 70;

await sharp(SOURCE)
  .resize({ width: TARGET_WIDTH, withoutEnlargement: true })
  .webp({ quality: QUALITY, effort: 6 })
  .toFile(OUTPUT);

const { size } = statSync(OUTPUT);
const kb = (size / 1024).toFixed(1);
console.log(`Generated ${OUTPUT} — ${kb} KB`);
