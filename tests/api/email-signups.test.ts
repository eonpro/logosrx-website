import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

/**
 * Integration tests for the public newsletter-signup route handler. The DB and
 * origin/rate-limit side effects are stubbed so the test exercises the real
 * request branching: origin check → rate limit → honeypot → Zod validation →
 * insert. These public POST paths were previously only covered by (skippable)
 * E2E, so unit-level coverage guards the validation/error contract in CI.
 */
const mocks = vi.hoisted(() => ({
  checkSameOrigin: vi.fn(() => ({ ok: true })),
  rateLimit: vi.fn(async () => ({ success: true, reset: 0, remaining: 10 })),
  onConflict: vi.fn(async () => undefined),
}));

vi.mock("@/lib/security/origin", () => ({
  checkSameOrigin: mocks.checkSameOrigin,
}));

vi.mock("@/lib/db", () => ({
  db: {
    insert: () => ({
      values: () => ({ onConflictDoNothing: mocks.onConflict }),
    }),
  },
}));

vi.mock("@/lib/security/rate-limit", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/security/rate-limit")>();
  return { ...actual, rateLimit: mocks.rateLimit };
});

import { POST } from "@/app/api/email-signups/route";

function makeReq(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest("https://logosrx.com/api/email-signups", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      origin: "https://logosrx.com",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  mocks.checkSameOrigin.mockReturnValue({ ok: true });
  mocks.rateLimit.mockResolvedValue({ success: true, reset: 0, remaining: 10 });
  mocks.onConflict.mockClear();
});

describe("POST /api/email-signups", () => {
  it("accepts and persists a valid email", async () => {
    const res = await POST(makeReq({ email: "Hello@Example.com" }));
    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toEqual({ success: true });
    expect(mocks.onConflict).toHaveBeenCalledTimes(1);
  });

  it("rejects a malformed email with 400", async () => {
    const res = await POST(makeReq({ email: "nope" }));
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "Invalid email address.",
    });
    expect(mocks.onConflict).not.toHaveBeenCalled();
  });

  it("rejects a missing email with 400", async () => {
    const res = await POST(makeReq({}));
    expect(res.status).toBe(400);
    expect(mocks.onConflict).not.toHaveBeenCalled();
  });

  it("silently succeeds and skips the insert when the honeypot is tripped", async () => {
    const res = await POST(
      makeReq({ email: "real@example.com", company_website: "spam" }),
    );
    expect(res.status).toBe(201);
    expect(mocks.onConflict).not.toHaveBeenCalled();
  });

  it("returns 403 when the origin check fails", async () => {
    mocks.checkSameOrigin.mockReturnValue({ ok: false });
    const res = await POST(makeReq({ email: "real@example.com" }));
    expect(res.status).toBe(403);
    expect(mocks.onConflict).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limited", async () => {
    mocks.rateLimit.mockResolvedValue({ success: false, reset: 0, remaining: 0 });
    const res = await POST(makeReq({ email: "real@example.com" }));
    expect(res.status).toBe(429);
    expect(mocks.onConflict).not.toHaveBeenCalled();
  });
});
