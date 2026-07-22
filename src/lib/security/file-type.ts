/**
 * Detects the true file type from the bytes of an uploaded file.
 *
 * Browsers report the MIME type the OS associated with a filename, which an
 * attacker can spoof by renaming `payload.exe` to `resume.pdf`. The bytes don't
 * lie — every PDF / Office document has a well-known leading signature, and
 * Office containers carry identifiable internal structure.
 *
 * Returns the canonical MIME type when the file matches a supported resume
 * format, or `null` if it doesn't. We intentionally limit support to PDF, DOC
 * (legacy OLE2 with a WordDocument stream), and DOCX (Office Open XML ZIP with
 * a word/ part) to keep the attack surface small. The client-declared MIME is
 * never consulted — an arbitrary ZIP or non-Word OLE2 container is rejected
 * regardless of what the browser claims it is.
 */

export type SupportedResumeMime =
  | "application/pdf"
  | "application/msword"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

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

/** Byte-preserving decode so we can substring-search binary data. */
function decodeLatin1(buf: ArrayBuffer): string {
  return new TextDecoder("latin1").decode(new Uint8Array(buf));
}

/**
 * A DOCX package must list `[Content_Types].xml` and a `word/` part. Entry
 * names live in the ZIP central directory at the end of the archive (and the
 * content-types entry conventionally leads the file), so checking the head and
 * tail is enough without unpacking the archive.
 */
async function looksLikeDocx(file: File): Promise<boolean> {
  const HEAD_BYTES = 4 * 1024;
  const TAIL_BYTES = 64 * 1024;
  const head = decodeLatin1(await file.slice(0, HEAD_BYTES).arrayBuffer());
  const tailStart = Math.max(0, file.size - TAIL_BYTES);
  const tail =
    tailStart === 0 ? head : decodeLatin1(await file.slice(tailStart).arrayBuffer());
  const haystack = head + tail;
  return (
    haystack.includes("[Content_Types].xml") && haystack.includes("word/")
  );
}

/**
 * A legacy Word file is an OLE2 compound document containing a stream named
 * `WordDocument` (stored as UTF-16LE in the compound file directory). Other
 * OLE2 containers (old Excel, MSI installers, …) don't have it.
 */
const WORD_STREAM_UTF16 = "W\0o\0r\0d\0D\0o\0c\0u\0m\0e\0n\0t\0";

async function looksLikeLegacyDoc(file: File): Promise<boolean> {
  // The directory sector can sit anywhere; resumes are small enough that a
  // full scan is acceptable (uploads are already size-capped by the route).
  const content = decodeLatin1(await file.arrayBuffer());
  return content.includes(WORD_STREAM_UTF16);
}

export async function detectResumeMime(
  file: File,
): Promise<SupportedResumeMime | null> {
  const headerBuf = new Uint8Array(await file.slice(0, 16).arrayBuffer());

  if (startsWith(headerBuf, PDF_MAGIC)) return "application/pdf";
  if (startsWith(headerBuf, OLE2_MAGIC)) {
    return (await looksLikeLegacyDoc(file)) ? "application/msword" : null;
  }
  if (isZipMagic(headerBuf)) {
    return (await looksLikeDocx(file)) ? DOCX_MIME : null;
  }

  return null;
}

/**
 * Strict PDF-only check (invoice uploads). Returns the canonical MIME type
 * when the bytes carry the `%PDF-` signature, `null` otherwise. The
 * client-declared MIME is never consulted.
 */
export async function detectPdfMime(
  file: File,
): Promise<"application/pdf" | null> {
  const headerBuf = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  return startsWith(headerBuf, PDF_MAGIC) ? "application/pdf" : null;
}
