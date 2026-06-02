/**
 * Detects the true image type from an uploaded file's leading bytes.
 *
 * As with resume uploads, the browser-reported MIME type is just a filename
 * hint and can be spoofed. We trust only the magic bytes and accept a small
 * set of web-safe raster formats for merchandising imagery.
 */

export type SupportedImageMime =
  | "image/png"
  | "image/jpeg"
  | "image/gif"
  | "image/webp";

const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_MAGIC = [0xff, 0xd8, 0xff];
const GIF_MAGIC = [0x47, 0x49, 0x46, 0x38]; // "GIF8"
const RIFF_MAGIC = [0x52, 0x49, 0x46, 0x46]; // "RIFF"
const WEBP_MAGIC = [0x57, 0x45, 0x42, 0x50]; // "WEBP" (offset 8)

function startsWith(buf: Uint8Array, sig: number[], offset = 0): boolean {
  if (buf.length < offset + sig.length) return false;
  for (let i = 0; i < sig.length; i += 1) {
    if (buf[offset + i] !== sig[i]) return false;
  }
  return true;
}

export async function detectImageMime(
  file: File,
): Promise<SupportedImageMime | null> {
  const headerBuf = new Uint8Array(await file.slice(0, 16).arrayBuffer());

  if (startsWith(headerBuf, PNG_MAGIC)) return "image/png";
  if (startsWith(headerBuf, JPEG_MAGIC)) return "image/jpeg";
  if (startsWith(headerBuf, GIF_MAGIC)) return "image/gif";
  if (startsWith(headerBuf, RIFF_MAGIC) && startsWith(headerBuf, WEBP_MAGIC, 8)) {
    return "image/webp";
  }
  return null;
}

/** Maps a verified MIME to a file extension for the stored blob path. */
export function imageExtension(mime: SupportedImageMime): string {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/jpeg":
      return "jpg";
    case "image/gif":
      return "gif";
    case "image/webp":
      return "webp";
  }
}
