import { config } from "dotenv";
config({ path: ".env.local" });

import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { randomBytes } from "node:crypto";
import { put } from "@vercel/blob";

/**
 * Uploads the catalog PDF to Vercel Blob and prints the env values to wire up
 * the private `/download/catalog` link.
 *
 *   npm run catalog:upload -- "/abs/path/to/Logos RX Catalog 2026.pdf"
 *
 * Requires `BLOB_READ_WRITE_TOKEN` in `.env.local` (Vercel project → Storage →
 * Blob → ".env.local" snippet, or `vercel env pull`).
 *
 * The blob is uploaded `public` with a random suffix, so its URL is unguessable
 * — and the `/download/catalog` route never exposes it anyway (it streams the
 * file through). The download is gated by `CATALOG_DOWNLOAD_TOKEN`, which this
 * script generates a strong value for when one isn't already set.
 */

const DEFAULT_PATH =
  "/Users/italo/Desktop/LOGOS RX CATALOG 2026/Logos RX Catalog 2026.pdf";

async function main() {
  const filePath = process.argv[2] ?? DEFAULT_PATH;

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.error(
      "Missing BLOB_READ_WRITE_TOKEN. Add it to .env.local (Vercel → Storage → " +
        "Blob), or run `vercel env pull .env.local`, then re-run.",
    );
    process.exit(1);
  }

  let file: Buffer;
  try {
    file = await readFile(filePath);
  } catch {
    console.error(`Could not read file: ${filePath}`);
    process.exit(1);
  }

  const sizeMb = (file.length / (1024 * 1024)).toFixed(1);
  console.log(`Uploading "${basename(filePath)}" (${sizeMb} MB) to Vercel Blob…`);

  const blob = await put("catalog/Logos-RX-Catalog-2026.pdf", file, {
    access: "public",
    addRandomSuffix: true, // unguessable URL
    contentType: "application/pdf",
    cacheControlMaxAge: 60 * 60 * 24 * 365,
  });

  const existingToken = process.env.CATALOG_DOWNLOAD_TOKEN?.trim();
  const token = existingToken || randomBytes(32).toString("base64url");

  console.log("\n✅ Uploaded.\n");
  console.log("Set these in your hosting env (and .env.local for local dev):\n");
  console.log(`CATALOG_PDF_URL=${blob.url}`);
  console.log(`CATALOG_DOWNLOAD_TOKEN=${token}`);
  if (existingToken) {
    console.log("\n(Reusing the CATALOG_DOWNLOAD_TOKEN already in your env.)");
  }
  console.log("\nPrivate share link:");
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.logosrx.com";
  console.log(`${base}/download/catalog?key=${token}`);
}

main().catch((err) => {
  console.error("\nUpload failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
