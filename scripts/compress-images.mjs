#!/usr/bin/env node
/**
 * One-shot image compressor for `public/images/`.
 *
 * Run with: `node scripts/compress-images.mjs`
 *
 * Targets:
 *   - Hero / background WebP: re-encode at quality 78, effort 6, capped at
 *     1920px wide.
 *   - Product insert PNGs: re-encode to WebP at quality 82, replacing the PNG.
 *     References in `src/data/product-inserts.ts` are updated automatically.
 *   - All others are left untouched.
 *
 * Re-runnable; only writes when the new file is smaller than the original.
 */

import { readFile, writeFile, unlink, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname, extname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const IMAGES = join(ROOT, "public/images");
const PRODUCT_INSERTS_DATA = join(ROOT, "src/data/product-inserts.ts");

const log = (...args) => console.log("[compress]", ...args);

function kb(bytes) {
  return `${(bytes / 1024).toFixed(0)} KB`;
}

async function compressWebP(file, { quality = 78, maxWidth = 1920 } = {}) {
  // Single read of the source bytes — no intermediate `stat()` check, so
  // there is no time-of-check / time-of-use window between the size probe
  // and the rewrite.
  const originalBytes = await readFile(file);
  const newBytes = await sharp(originalBytes)
    .rotate()
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality, effort: 6 })
    .toBuffer();
  if (newBytes.byteLength >= originalBytes.byteLength) {
    log(`skip   ${file} (re-encoded was larger)`);
    return;
  }
  await writeFile(file, newBytes);
  log(`webp   ${file}  ${kb(originalBytes.byteLength)} → ${kb(newBytes.byteLength)}`);
}

async function pngToWebP(pngFile, { quality = 82, maxWidth = 1400 } = {}) {
  const originalBytes = await readFile(pngFile);
  const webpFile = pngFile.replace(/\.png$/i, ".webp");
  const buffer = await sharp(originalBytes)
    .rotate()
    .resize({ width: maxWidth, withoutEnlargement: true })
    .webp({ quality, effort: 6 })
    .toBuffer();
  await writeFile(webpFile, buffer);
  await unlink(pngFile);
  log(`png→webp ${pngFile}  ${kb(originalBytes.byteLength)} → ${kb(buffer.byteLength)}`);
  return { from: basename(pngFile), to: basename(webpFile) };
}

const WEBP_BACKGROUNDS = [
  { name: "building-trust-bg.webp", quality: 78, maxWidth: 1920 },
  { name: "patient-refill-box.webp", quality: 80, maxWidth: 1600 },
  { name: "hand-vial.webp", quality: 82, maxWidth: 1200 },
  { name: "trusted-providers.webp", quality: 82, maxWidth: 1200 },
];

async function compressBackgrounds() {
  for (const { name, quality, maxWidth } of WEBP_BACKGROUNDS) {
    const file = join(IMAGES, name);
    if (!existsSync(file)) continue;
    await compressWebP(file, { quality, maxWidth });
  }
}

async function convertProductInserts() {
  const dir = join(IMAGES, "product-inserts");
  if (!existsSync(dir)) return [];
  const entries = await readdir(dir);
  const conversions = [];
  for (const entry of entries) {
    if (extname(entry).toLowerCase() !== ".png") continue;
    const result = await pngToWebP(join(dir, entry));
    if (result) conversions.push(result);
  }
  return conversions;
}

async function updateProductInsertsData(conversions) {
  if (!conversions.length) return;
  // Read the file directly — letting `readFile` throw on ENOENT is the
  // race-free way to "check then use" (no explicit `existsSync` probe
  // before the read/write pair).
  let source;
  try {
    source = await readFile(PRODUCT_INSERTS_DATA, "utf8");
  } catch (err) {
    if (err.code === "ENOENT") return;
    throw err;
  }
  for (const { from, to } of conversions) {
    source = source.replaceAll(from, to);
  }
  await writeFile(PRODUCT_INSERTS_DATA, source);
  log(`updated ${PRODUCT_INSERTS_DATA}`);
}

async function deleteIfExists(file) {
  if (existsSync(file)) {
    await unlink(file);
    log(`deleted ${file}`);
  }
}

await deleteIfExists(join(IMAGES, "products/nad.webp"));
await compressBackgrounds();
const conversions = await convertProductInserts();
await updateProductInsertsData(conversions);
log("done.");
