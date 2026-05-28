/**
 * Detects the true file type from the first few bytes of an uploaded file.
 *
 * Browsers report the MIME type the OS associated with a filename, which an
 * attacker can spoof by renaming `payload.exe` to `resume.pdf`. The bytes don't
 * lie — every PDF / Office document has a well-known leading signature.
 *
 * Returns the canonical MIME type when the file matches a supported resume
 * format, or `null` if it doesn't. We intentionally limit support to PDF, DOC
 * (legacy OLE2), and DOCX (Office Open XML / ZIP container) to keep the
 * attack surface small.
 */

export type SupportedResumeMime =
  | "application/pdf"
  | "application/msword"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-
const OLE2_MAGIC = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]; // legacy .doc
const ZIP_LOCAL_HEADER = [0x50, 0x4b, 0x03, 0x04]; // PK\x03\x04 (also DOCX)
const ZIP_EMPTY_HEADER = [0x50, 0x4b, 0x05, 0x06];
const ZIP_SPANNED_HEADER = [0x50, 0x4b, 0x07, 0x08];

function startsWith(buf: Uint8Array, signature: number[]): boolean {
  if (buf.length < signature.length) return false;
  for (let i = 0; i < signature.length; i += 1) {
    if (buf[i] !== signature[i]) return false;
  }
  return true;
}

function isZipMagic(buf: Uint8Array): boolean {
  return (
    startsWith(buf, ZIP_LOCAL_HEADER) ||
    startsWith(buf, ZIP_EMPTY_HEADER) ||
    startsWith(buf, ZIP_SPANNED_HEADER)
  );
}

export async function detectResumeMime(
  file: File,
): Promise<SupportedResumeMime | null> {
  // We only need to inspect the first ~16 bytes; reading the whole file just
  // to detect the magic would be wasteful and DoS-friendly.
  const headerBlob = file.slice(0, 16);
  const headerBuf = new Uint8Array(await headerBlob.arrayBuffer());

  if (startsWith(headerBuf, PDF_MAGIC)) return "application/pdf";
  if (startsWith(headerBuf, OLE2_MAGIC)) return "application/msword";
  if (isZipMagic(headerBuf)) {
    // DOCX is a ZIP, but so is .zip itself. Cross-check the client-declared
    // MIME so we don't accept an arbitrary archive masquerading as DOCX.
    if (
      file.type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }
    return null;
  }

  return null;
}
