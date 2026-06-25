import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getCatalogDownloadConfig,
  getFlipbookPages,
  verifyCatalogToken,
} from "./download";

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
      CATALOG_FLIPBOOK_URL: "  https://blob.example/manifest.json  ",
    } as unknown as NodeJS.ProcessEnv);
    expect(cfg).toEqual({
      token: "tok",
      pdfUrl: "https://blob.example/x.pdf",
      coverUrl: "https://blob.example/cover.jpg",
      flipbookUrl: "https://blob.example/manifest.json",
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
      flipbookUrl: null,
    });
    expect(
      getCatalogDownloadConfig({
        CATALOG_DOWNLOAD_TOKEN: "   ",
        CATALOG_PDF_URL: "",
        CATALOG_COVER_URL: "  ",
        CATALOG_FLIPBOOK_URL: "   ",
      } as unknown as NodeJS.ProcessEnv),
    ).toEqual({ token: null, pdfUrl: null, coverUrl: null, flipbookUrl: null });
  });
});

describe("getFlipbookPages", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns null when no manifest URL is configured (without fetching)", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    expect(await getFlipbookPages(null)).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns the ordered page URLs from a valid manifest", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          version: 1,
          pageCount: 2,
          pages: ["https://b/p1.webp", "https://b/p2.webp"],
        }),
      })),
    );
    expect(await getFlipbookPages("https://b/manifest.json")).toEqual([
      "https://b/p1.webp",
      "https://b/p2.webp",
    ]);
  });

  it("returns null on a non-ok response or malformed body", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false })));
    expect(await getFlipbookPages("https://b/manifest.json")).toBeNull();

    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => ({ pages: [] }) })),
    );
    expect(await getFlipbookPages("https://b/manifest.json")).toBeNull();
  });

  it("returns null when fetch throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("network");
      }),
    );
    expect(await getFlipbookPages("https://b/manifest.json")).toBeNull();
  });
});
