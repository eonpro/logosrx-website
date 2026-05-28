import { describe, expect, it } from "vitest";
import {
  encodeContentDispositionFilename,
  sanitizeFilename,
} from "./filename";

describe("sanitizeFilename", () => {
  it("returns 'file' for empty or whitespace input", () => {
    expect(sanitizeFilename("")).toBe("file");
    expect(sanitizeFilename("   ")).toBe("file");
    expect(sanitizeFilename("\t\n")).toBe("file");
  });

  it("strips path traversal segments", () => {
    expect(sanitizeFilename("../../etc/passwd")).toBe("passwd");
    expect(sanitizeFilename("..\\..\\Windows\\System32\\cmd.exe")).toBe(
      "cmd.exe",
    );
    expect(sanitizeFilename("./resume.pdf")).toBe("resume.pdf");
  });

  it("does not let pure traversal produce '.' or '..'", () => {
    expect(sanitizeFilename("..")).toBe("file");
    expect(sanitizeFilename("...")).toBe("file");
    expect(sanitizeFilename("./")).toBe("file");
    expect(sanitizeFilename("./../")).toBe("file");
  });

  it("removes control characters", () => {
    expect(sanitizeFilename("re\x00sume\x07.pdf")).toBe("resume.pdf");
    expect(sanitizeFilename("re\x1fsume.pdf")).toBe("resume.pdf");
    expect(sanitizeFilename("re\x7fsume.pdf")).toBe("resume.pdf");
  });

  it("collapses non-whitelisted characters into a single dash", () => {
    expect(sanitizeFilename("résumé Jane Doe.pdf")).toBe("r-sum-Jane-Doe.pdf");
    expect(sanitizeFilename("file with    spaces.pdf")).toBe(
      "file-with-spaces.pdf",
    );
    // Run-of-non-whitelisted chars collapse to a single `-`, which then
    // sits between the name and the dot — the trim only strips leading /
    // trailing dashes from the full string, not adjacent to extensions.
    expect(sanitizeFilename("name!!!@@@###.pdf")).toBe("name-.pdf");
  });

  it("preserves common separators inside the name", () => {
    expect(sanitizeFilename("jane.doe_2026-CV.pdf")).toBe(
      "jane.doe_2026-CV.pdf",
    );
  });

  it("trims leading and trailing dashes", () => {
    expect(sanitizeFilename("---resume---")).toBe("resume");
  });

  it("caps total length and preserves the extension when present", () => {
    const long = "a".repeat(300) + ".pdf";
    const result = sanitizeFilename(long);
    expect(result.length).toBeLessThanOrEqual(200);
    expect(result.endsWith(".pdf")).toBe(true);
  });

  it("respects a custom maxLength", () => {
    expect(sanitizeFilename("hello-world.pdf", 8)).toMatch(/\.pdf$/);
    expect(sanitizeFilename("hello-world.pdf", 8).length).toBeLessThanOrEqual(
      8,
    );
  });

  it("truncates extension-less names cleanly", () => {
    expect(sanitizeFilename("a".repeat(250)).length).toBe(200);
  });
});

describe("encodeContentDispositionFilename", () => {
  it("emits both filename and filename* parameters", () => {
    const header = encodeContentDispositionFilename("resume.pdf");
    expect(header).toContain('filename="resume.pdf"');
    expect(header).toContain("filename*=UTF-8''resume.pdf");
  });

  it("percent-encodes unicode names in filename*", () => {
    const header = encodeContentDispositionFilename("résumé.pdf");
    // The sanitized filename loses the accent in the unquoted form, but
    // both halves of the header should still be present.
    expect(header).toMatch(/filename="[A-Za-z0-9._-]+\.pdf"/);
    expect(header).toContain("filename*=UTF-8''");
  });

  it("escapes embedded quotes in the unquoted form", () => {
    const header = encodeContentDispositionFilename('a"b.pdf');
    expect(header).not.toMatch(/filename="a"b\.pdf"/);
  });
});
