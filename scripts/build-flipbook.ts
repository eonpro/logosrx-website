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

  const pages = numberedPages(entries);
  if (pages.length === 0) {
    console.error(`No numbered page images (e.g. "1. ….jpg") found in ${dir}`);
    process.exit(1);
  }

  console.log(`Found ${pages.length} pages. Optimizing → WebP and uploading…`);

  const urls: string[] = [];
  let i = 0;
  for (const page of pages) {
    i += 1;
    const slot = String(i).padStart(2, "0");
    const input = await readFile(join(dir, page.file));
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
    console.log(`  [${slot}/${pages.length}] ${page.file} → ${kb} KB`);
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
