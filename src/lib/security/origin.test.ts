import { afterEach, describe, expect, it, vi } from "vitest";
import { checkSameOrigin } from "./origin";

interface MockHeaders {
  origin?: string;
  referer?: string;
  host?: string;
  forwardedHost?: string;
}

function makeRequest(headers: MockHeaders) {
  return {
    headers: {
      get(name: string) {
        const lower = name.toLowerCase();
        if (lower === "origin") return headers.origin ?? null;
        if (lower === "referer") return headers.referer ?? null;
        if (lower === "host") return headers.host ?? null;
        if (lower === "x-forwarded-host")
          return headers.forwardedHost ?? null;
        return null;
      },
    },
  } as unknown as Parameters<typeof checkSameOrigin>[0];
}

afterEach(() => {
  // `vi.stubEnv` restores `process.env.NODE_ENV` after each test.
  vi.unstubAllEnvs();
});

describe("checkSameOrigin", () => {
  it("accepts the canonical production origin", () => {
    expect(
      checkSameOrigin(
        makeRequest({
          origin: "https://www.logosrx.com",
          host: "www.logosrx.com",
        }),
      ),
    ).toEqual({ ok: true });
  });

  it("accepts the apex origin", () => {
    expect(
      checkSameOrigin(
        makeRequest({ origin: "https://logosrx.com", host: "logosrx.com" }),
      ),
    ).toEqual({ ok: true });
  });

  it("accepts vercel preview deploys over https", () => {
    expect(
      checkSameOrigin(
        makeRequest({
          origin: "https://logos-website-abc123.vercel.app",
          host: "logos-website-abc123.vercel.app",
        }),
      ),
    ).toEqual({ ok: true });
  });

  it("rejects http vercel previews when host doesn't match", () => {
    // The "matches the request's host" fallback would let this through,
    // so we explicitly model a mismatched host (Vercel always normalises
    // preview hosts to https). The dedicated preview rule rejects http.
    expect(
      checkSameOrigin(
        makeRequest({
          origin: "http://logos-website-abc123.vercel.app",
          host: "www.logosrx.com",
        }),
      ),
    ).toEqual({ ok: false, reason: "mismatch" });
  });

  it("rejects a cross-origin request from an attacker domain", () => {
    expect(
      checkSameOrigin(
        makeRequest({
          origin: "https://evil.example.com",
          host: "www.logosrx.com",
        }),
      ),
    ).toEqual({ ok: false, reason: "mismatch" });
  });

  it("falls back to Referer when Origin is missing", () => {
    expect(
      checkSameOrigin(
        makeRequest({
          referer: "https://www.logosrx.com/careers",
          host: "www.logosrx.com",
        }),
      ),
    ).toEqual({ ok: true });
  });

  it("returns 'missing' when both Origin and Referer are absent", () => {
    expect(
      checkSameOrigin(makeRequest({ host: "www.logosrx.com" })),
    ).toEqual({ ok: false, reason: "missing" });
  });

  it("returns 'invalid' for malformed Origin URLs", () => {
    expect(
      checkSameOrigin(
        makeRequest({ origin: "not a url", host: "www.logosrx.com" }),
      ),
    ).toEqual({ ok: false, reason: "invalid" });
  });

  it("accepts localhost only in non-production", () => {
    vi.stubEnv("NODE_ENV", "development");
    expect(
      checkSameOrigin(
        makeRequest({
          origin: "http://localhost:3000",
          host: "localhost:3000",
        }),
      ),
    ).toEqual({ ok: true });

    vi.stubEnv("NODE_ENV", "production");
    expect(
      checkSameOrigin(
        makeRequest({
          origin: "http://localhost:3000",
          host: "www.logosrx.com",
        }),
      ).ok,
    ).toBe(false);
  });

  it("trusts a same-host request even on custom preview domains", () => {
    expect(
      checkSameOrigin(
        makeRequest({
          origin: "https://staging.example.com",
          forwardedHost: "staging.example.com",
        }),
      ),
    ).toEqual({ ok: true });
  });
});
