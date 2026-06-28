import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

/**
 * Integration tests for the public clinic-signup route handler. DB +
 * attribution + origin/rate-limit are stubbed so the test exercises the real
 * branching: origin → rate limit → honeypot → Zod validation → insert.
 */
const mocks = vi.hoisted(() => ({
  checkSameOrigin: vi.fn(() => ({ ok: true })),
  rateLimit: vi.fn(async () => ({ success: true, reset: 0, remaining: 10 })),
  returning: vi.fn(async () => [{ id: 42 }]),
  resolveReferralCode: vi.fn(async () => null),
}));

vi.mock("@/lib/security/origin", () => ({
  checkSameOrigin: mocks.checkSameOrigin,
}));

vi.mock("@/lib/partners/attribution", () => ({
  resolveReferralCode: mocks.resolveReferralCode,
}));

vi.mock("@/lib/db", () => ({
  db: {
    insert: () => ({
      values: () => ({ returning: mocks.returning }),
    }),
  },
}));

vi.mock("@/lib/security/rate-limit", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/security/rate-limit")>();
  return { ...actual, rateLimit: mocks.rateLimit };
});

import { POST } from "@/app/api/clinic-signups/route";

const VALID = {
  clinicName: "Acme Clinic",
  contactName: "Jane Doe",
  email: "jane@acme.com",
  phone: "555-123-4567",
};

function makeReq(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest("https://logosrx.com/api/clinic-signups", {
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
  mocks.returning.mockResolvedValue([{ id: 42 }]);
  mocks.returning.mockClear();
});

describe("POST /api/clinic-signups", () => {
  it("accepts a complete submission and returns the new id", async () => {
    const res = await POST(makeReq(VALID));
    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toEqual({ success: true, id: 42 });
    expect(mocks.returning).toHaveBeenCalledTimes(1);
  });

  it("requires the core contact fields", async () => {
    const res = await POST(makeReq({ clinicName: "Acme" }));
    expect(res.status).toBe(400);
    expect(mocks.returning).not.toHaveBeenCalled();
  });

  it("rejects an invalid email", async () => {
    const res = await POST(makeReq({ ...VALID, email: "bad" }));
    expect(res.status).toBe(400);
    expect(mocks.returning).not.toHaveBeenCalled();
  });

  it("silently succeeds and skips the insert when the honeypot is tripped", async () => {
    const res = await POST(makeReq({ ...VALID, company_website: "bot" }));
    expect(res.status).toBe(201);
    expect(mocks.returning).not.toHaveBeenCalled();
  });

  it("returns 403 on a cross-origin request", async () => {
    mocks.checkSameOrigin.mockReturnValue({ ok: false });
    const res = await POST(makeReq(VALID));
    expect(res.status).toBe(403);
    expect(mocks.returning).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limited", async () => {
    mocks.rateLimit.mockResolvedValue({ success: false, reset: 0, remaining: 0 });
    const res = await POST(makeReq(VALID));
    expect(res.status).toBe(429);
    expect(mocks.returning).not.toHaveBeenCalled();
  });
});
