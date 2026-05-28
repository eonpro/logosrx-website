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

  it("recognises a legacy .doc by the OLE2 magic", async () => {
    const file = makeFile(
      [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0x00, 0x00],
      "resume.doc",
      "application/msword",
    );
    await expect(detectResumeMime(file)).resolves.toBe("application/msword");
  });

  it("recognises a DOCX (ZIP) only when the client MIME agrees", async () => {
    const zipMagic = [0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00];
    const docx = makeFile(
      zipMagic,
      "resume.docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
    await expect(detectResumeMime(docx)).resolves.toBe(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );
  });

  it("rejects an arbitrary ZIP masquerading as DOCX", async () => {
    const zipMagic = [0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00];
    // Same bytes, but the client claims it's a plain zip — must reject.
    const zip = makeFile(zipMagic, "archive.zip", "application/zip");
    await expect(detectResumeMime(zip)).resolves.toBeNull();
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
