import { describe, expect, it } from "vitest";
import { detectResumeMime } from "./file-type";

function makeFile(bytes: number[], name: string, type: string): File {
  // happy-dom's File honors the type string passed in, which mimics the
  // browser-supplied MIME exactly.
  return new File([new Uint8Array(bytes)], name, { type });
}

describe("detectResumeMime", () => {
  it("recognises a real PDF by the %PDF- magic", async () => {
    const file = makeFile(
      [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37],
      "resume.pdf",
      "application/pdf",
    );
    await expect(detectResumeMime(file)).resolves.toBe("application/pdf");
  });

  it("recognises a legacy .doc by OLE2 magic + WordDocument stream", async () => {
    const ole2Magic = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0x00, 0x00];
    // Compound-file directory entries store stream names as UTF-16LE.
    const wordStream = Array.from("WordDocument").flatMap((c) => [
      c.charCodeAt(0),
      0x00,
    ]);
    const file = makeFile(
      [...ole2Magic, ...wordStream],
      "resume.doc",
      "application/msword",
    );
    await expect(detectResumeMime(file)).resolves.toBe("application/msword");
  });

  it("rejects a non-Word OLE2 container even with a msword MIME", async () => {
    const file = makeFile(
      [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0x00, 0x00],
      "resume.doc",
      "application/msword",
    );
    await expect(detectResumeMime(file)).resolves.toBeNull();
  });

  it("recognises a DOCX by its OOXML package structure", async () => {
    const zipMagic = [0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00];
    const entries = Array.from("[Content_Types].xml ... word/document.xml").map(
      (c) => c.charCodeAt(0),
    );
    // Declared MIME is irrelevant — even octet-stream must be accepted.
    const docx = makeFile(
      [...zipMagic, ...entries],
      "resume.docx",
      "application/octet-stream",
    );
    await expect(detectResumeMime(docx)).resolves.toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
  });

  it("rejects an arbitrary ZIP masquerading as DOCX", async () => {
    const zipMagic = [0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00];
    // Correct DOCX MIME, but no OOXML structure inside — must reject.
    const zip = makeFile(
      zipMagic,
      "resume.docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    await expect(detectResumeMime(zip)).resolves.toBeNull();
  });

  it("accepts a real PDF sent as application/octet-stream", async () => {
    const file = makeFile(
      [0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37],
      "resume.pdf",
      "application/octet-stream",
    );
    await expect(detectResumeMime(file)).resolves.toBe("application/pdf");
  });

  it("rejects a renamed executable (.exe with .pdf extension)", async () => {
    // PE magic: MZ header.
    const file = makeFile(
      [0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00],
      "resume.pdf",
      "application/pdf",
    );
    await expect(detectResumeMime(file)).resolves.toBeNull();
  });

  it("rejects an HTML payload with a doctored MIME", async () => {
    const file = makeFile(
      [0x3c, 0x21, 0x44, 0x4f, 0x43, 0x54, 0x59, 0x50, 0x45],
      "resume.pdf",
      "application/pdf",
    );
    await expect(detectResumeMime(file)).resolves.toBeNull();
  });

  it("handles tiny files smaller than the magic-byte window", async () => {
    const file = makeFile([0x25], "tiny.pdf", "application/pdf");
    await expect(detectResumeMime(file)).resolves.toBeNull();
  });
});
