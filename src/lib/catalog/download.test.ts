import { describe, expect, it } from "vitest";
import { getCatalogDownloadConfig, verifyCatalogToken } from "./download";

describe("verifyCatalogToken", () => {
  it("accepts the exact configured token", () => {
    expect(verifyCatalogToken("s3cret-token", "s3cret-token")).toBe(true);
  });

  it("rejects a wrong token of the same length", () => {
    expect(verifyCatalogToken("s3cret-tokenX", "s3cret-tokenY")).toBe(false);
  });

  it("rejects a wrong token of a different length (no length leak / throw)", () => {
    expect(verifyCatalogToken("short", "a-much-longer-secret")).toBe(false);
  });

  it("fails closed when no secret is configured", () => {
    // A misconfigured deployment must deny everyone, not allow everyone.
    expect(verifyCatalogToken("anything", null)).toBe(false);
    expect(verifyCatalogToken("anything", "")).toBe(false);
    expect(verifyCatalogToken("anything", undefined)).toBe(false);
  });

  it("rejects a missing/empty provided key", () => {
    expect(verifyCatalogToken(null, "s3cret")).toBe(false);
    expect(verifyCatalogToken("", "s3cret")).toBe(false);
    expect(verifyCatalogToken(undefined, "s3cret")).toBe(false);
  });
});

describe("getCatalogDownloadConfig", () => {
  it("reads and trims the env vars", () => {
    const cfg = getCatalogDownloadConfig({
      CATALOG_DOWNLOAD_TOKEN: "  tok  ",
      CATALOG_PDF_URL: "  https://blob.example/x.pdf  ",
      CATALOG_COVER_URL: "  https://blob.example/cover.jpg  ",
    } as unknown as NodeJS.ProcessEnv);
    expect(cfg).toEqual({
      token: "tok",
      pdfUrl: "https://blob.example/x.pdf",
      coverUrl: "https://blob.example/cover.jpg",
    });
  });

  it("leaves the cover URL null when unset (page uses a placeholder)", () => {
    const cfg = getCatalogDownloadConfig({
      CATALOG_DOWNLOAD_TOKEN: "tok",
      CATALOG_PDF_URL: "https://blob.example/x.pdf",
    } as unknown as NodeJS.ProcessEnv);
    expect(cfg.coverUrl).toBeNull();
  });

  it("returns null for unset or whitespace-only values", () => {
    expect(getCatalogDownloadConfig({} as NodeJS.ProcessEnv)).toEqual({
      token: null,
      pdfUrl: null,
      coverUrl: null,
    });
    expect(
      getCatalogDownloadConfig({
        CATALOG_DOWNLOAD_TOKEN: "   ",
        CATALOG_PDF_URL: "",
        CATALOG_COVER_URL: "  ",
      } as unknown as NodeJS.ProcessEnv),
    ).toEqual({ token: null, pdfUrl: null, coverUrl: null });
  });
});
