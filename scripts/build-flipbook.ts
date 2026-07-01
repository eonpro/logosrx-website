import { config } from "dotenv";
config({ path: ".env.local" });

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import sharp from "sharp";
import { put } from "@vercel/blob";

/**
 * Builds the online flipbook assets from the catalog page images.
 *
 *   npm run catalog:flipbook -- "/abs/path/to/LOGOS RX CATALOG 2026"
 *
 * For each numbered page image (`1. ….jpg`, `2. ….jpg`, …) it:
 *   1. resizes to a web-friendly width and converts to WebP (sharp),
 *   2. uploads it to Vercel Blob with an unguessable URL,
 * then uploads a `manifest.json` listing the page URLs in order and prints
 * `CATALOG_FLIPBOOK_URL` (the manifest URL) to wire up the viewer.
 *
 * Requires `BLOB_READ_WRITE_TOKEN` in `.env.local` (same as `catalog:upload`).
 *
 * Only files whose name starts with a number are included, sorted numerically,
 * so the flipbook order matches the printed catalog. Loose/unnumbered images
 * are skipped.
 */

const DEFAULT_DIR = "/Users/italo/Desktop/LOGOS RX CATALOG 2026";
const MAX_WIDTH = 1600; // 3300px source → 1600px is plenty for screen + zoom
const WEBP_QUALITY = 80;

/**
 * Loose product pages that aren't part of the numbered `N. ….jpg` sequence.
 * They're inserted right after the numbered page `EXTRA_AFTER_INDEX`, so they
 * stay grouped with the product pages and ahead of the back-matter
 * (white-label / shipping / states / label / end). Adjust the order of this
 * list or the anchor index to reposition them.
 */
const EXTRA_PAGES = [
  "peptides.jpg",
  "cyanocobalamin prodcut.jpg", // note: source filename has this spelling
  "tadalafil product page.jpg",
];
const EXTRA_AFTER_INDEX = 25; // after "25. LDS", before "26. White Label Packaging"

interface SourcePage {
  index: number;
  file: string;
}

function numberedPages(files: string[]): SourcePage[] {
  return files
    .map((file) => {
      const m = /^(\d+)\s*\./.exec(file);
      return m && /\.jpe?g$/i.test(file)
        ? { index: Number(m[1]), file }
        : null;
    })
    .filter((p): p is SourcePage => p !== null)
    .sort((a, b) => a.index - b.index);
}

/**
 * Full ordered list of page filenames: the numbered sequence with the loose
 * `EXTRA_PAGES` spliced in after `EXTRA_AFTER_INDEX` (or appended if that
 * anchor page isn't present).
 */
function orderedPageFiles(files: string[]): string[] {
  const numbered = numberedPages(files);
  const present = new Set(files);
  const extras = EXTRA_PAGES.filter((f) => present.has(f));
  const missing = EXTRA_PAGES.filter((f) => !present.has(f));
  if (missing.length > 0) {
    console.warn(`  ⚠ Skipping missing extra page(s): ${missing.join(", ")}`);
  }

  const result: string[] = [];
  let inserted = false;
  for (const page of numbered) {
    result.push(page.file);
    if (page.index === EXTRA_AFTER_INDEX) {
      result.push(...extras);
      inserted = true;
    }
  }
  if (!inserted) result.push(...extras);
  return result;
}

async function main() {
  const dir = process.argv[2] ?? DEFAULT_DIR;

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error(
      "Missing BLOB_READ_WRITE_TOKEN. Add it to .env.local (Vercel → Storage → " +
        "Blob), or run `vercel env pull .env.local`, then re-run.",
    );
    process.exit(1);
  }

  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    console.error(`Could not read directory: ${dir}`);
    process.exit(1);
  }

  const pageFiles = orderedPageFiles(entries);
  if (pageFiles.length === 0) {
    console.error(`No numbered page images (e.g. "1. ….jpg") found in ${dir}`);
    process.exit(1);
  }

  console.log(`Found ${pageFiles.length} pages. Optimizing → WebP and uploading…`);

  const urls: string[] = [];
  let i = 0;
  for (const file of pageFiles) {
    i += 1;
    const slot = String(i).padStart(2, "0");
    const input = await readFile(join(dir, file));
    const webp = await sharp(input)
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    const blob = await put(`catalog/flipbook/page-${slot}.webp`, webp, {
      access: "public",
      addRandomSuffix: true, // unguessable per-page URLs
      contentType: "image/webp",
      cacheControlMaxAge: 60 * 60 * 24 * 365,
    });
    urls.push(blob.url);
    const kb = (webp.length / 1024).toFixed(0);
    console.log(`  [${slot}/${pageFiles.length}] ${file} → ${kb} KB`);
  }

  const manifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    pageCount: urls.length,
    pages: urls,
  };

  const manifestBlob = await put(
    "catalog/flipbook/manifest.json",
    JSON.stringify(manifest, null, 2),
    {
      access: "public",
      addRandomSuffix: true,
      contentType: "application/json",
      cacheControlMaxAge: 60, // short — re-pointed whenever pages change
    },
  );

  console.log(`\n✅ Uploaded ${urls.length} pages + manifest.\n`);
  console.log("Set this in your hosting env (and .env.local for local dev):\n");
  console.log(`CATALOG_FLIPBOOK_URL=${manifestBlob.url}`);
}

main().catch((err) => {
  console.error("\nFlipbook build failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
