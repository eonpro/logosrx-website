import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

/**
 * Integration tests for the clinic ordering API (`/api/clinic/v1/*`). Key
 * auth, rate limiting, and the order pipeline are stubbed so the tests
 * exercise the route layer's real branching: auth → rate limit → JSON parse
 * → referenceId validation → pipeline mapping → error envelope shape.
 */

const mocks = vi.hoisted(() => ({
  authenticateClinicApiKey: vi.fn<
    (headers: { get(name: string): string | null }) => Promise<unknown>
  >(async () => ({
    clinic: {
      id: 7,
      pricingTier: "standard",
      pricingDiscountPct: 0,
      verificationStatus: "verified",
      lifefileOrderingEnabled: true,
    },
    keyId: 3,
  })),
  rateLimitKey: vi.fn(async () => ({ success: true, reset: 0, remaining: 59 })),
  submitOrderForClinic: vi.fn(async () => ({
    ok: true as const,
    orderId: 101,
    lfOrderId: "99000101",
    referenceId: "LGS-ehr-order-1001",
    status: "accepted" as const,
    deduped: false,
  })),
  getOrderableProducts: vi.fn(async () => [
    {
      id: "semaglutide-glycine-2.5mg-1ml",
      name: "Semaglutide / Glycine 2.5mg/1mL",
      strength: "2.5 mg/mL",
      form: "Injectable",
      unit: "Each",
      priceCents: 12000,
      orderable: true,
      controlled: false,
      quantityUnits: "each",
      defaultQuantity: "1",
    },
  ]),
}));

// The route helpers import "server-only", which throws outside a react-server
// module graph; neutralize it for the test runtime.
vi.mock("server-only", () => ({}));

vi.mock("@/lib/orders/api-auth", () => ({
  authenticateClinicApiKey: mocks.authenticateClinicApiKey,
}));

vi.mock("@/lib/security/rate-limit", () => ({
  rateLimitKey: mocks.rateLimitKey,
  rateLimitHeaders: () => ({}),
}));

vi.mock("@/lib/orders/service", () => ({
  submitOrderForClinic: mocks.submitOrderForClinic,
}));

vi.mock("@/lib/orders/products", () => ({
  getOrderableProducts: mocks.getOrderableProducts,
}));

// The DB is only touched by the GET lookup paths, which these tests don't
// exercise; mock it so importing the route doesn't open a pool.
vi.mock("@/lib/db", () => ({ db: {} }));

import { POST } from "@/app/api/clinic/v1/orders/route";
import { GET as GET_PRODUCTS } from "@/app/api/clinic/v1/products/route";

function orderBody(overrides: Record<string, unknown> = {}) {
  return {
    referenceId: "ehr-order-1001",
    prescriberNpi: "1003802901",
    patient: {
      firstName: "Pat",
      lastName: "Example",
      gender: "f",
      dateOfBirth: "1990-01-02",
    },
    shipping: {
      recipientType: "patient",
      recipientFirstName: "Pat",
      recipientLastName: "Example",
      addressLine1: "1 Main St",
      city: "Miami",
      state: "FL",
      zipCode: "33101",
    },
    rxs: [
      {
        productId: "semaglutide-glycine-2.5mg-1ml",
        directions: "Inject 10 units subcutaneously once weekly.",
        quantity: "1",
      },
    ],
    ...overrides,
  };
}

function makePost(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest("https://logosrx.com/api/clinic/v1/orders", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": "lxck_testkey123",
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.rateLimitKey.mockResolvedValue({ success: true, reset: 0, remaining: 59 });
  mocks.authenticateClinicApiKey.mockResolvedValue({
    clinic: {
      id: 7,
      pricingTier: "standard",
      pricingDiscountPct: 0,
      verificationStatus: "verified",
      lifefileOrderingEnabled: true,
    },
    keyId: 3,
  });
});

describe("POST /api/clinic/v1/orders", () => {
  it("submits an order and returns the ObsidianRx-style success envelope", async () => {
    const res = await POST(makePost(orderBody()));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.orderId).toBe(101);
    expect(json.lfOrderId).toBe("99000101");
    expect(json.referenceId).toBe("ehr-order-1001");
    expect(json.status).toBe("accepted");
    expect(json.requestId).toMatch(/^req_[0-9a-f]{24}$/);
    expect(res.headers.get("X-Request-Id")).toBe(json.requestId);

    // referenceId doubles as the idempotency key.
    const [, submission, submittedBy] =
      mocks.submitOrderForClinic.mock.calls[0] as unknown[];
    expect((submission as { submissionKey: string }).submissionKey).toBe(
      "ehr-order-1001",
    );
    expect(submittedBy).toBe("apikey:3");
  });

  it("rejects a missing or invalid API key with 401", async () => {
    mocks.authenticateClinicApiKey.mockResolvedValue(null);
    const res = await POST(makePost(orderBody()));
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("UNAUTHORIZED");
    expect(mocks.submitOrderForClinic).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limited", async () => {
    mocks.rateLimitKey.mockResolvedValue({ success: false, reset: 0, remaining: 0 });
    const res = await POST(makePost(orderBody()));
    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json.error.code).toBe("RATE_LIMITED");
  });

  it("returns 400 INVALID_JSON for unparseable bodies", async () => {
    const res = await POST(makePost("{not json"));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error.code).toBe("INVALID_JSON");
  });

  it("requires a well-formed referenceId", async () => {
    const res = await POST(makePost(orderBody({ referenceId: "no spaces!" })));
    expect(res.status).toBe(422);
    const json = await res.json();
    expect(json.error.code).toBe("VALIDATION_FAILED");
    expect(mocks.submitOrderForClinic).not.toHaveBeenCalled();
  });

  it.each([
    ["ORDERING_NOT_ENABLED", 403, "permission_error"],
    ["VALIDATION_FAILED", 422, "invalid_request"],
    ["CONTROLLED_SUBSTANCE", 422, "invalid_request"],
    ["PHARMACY_REJECTED", 502, "pharmacy_error"],
    ["PHARMACY_UNREACHABLE", 503, "pharmacy_error"],
    ["INTERNAL_ERROR", 500, "api_error"],
  ] as const)(
    "maps pipeline code %s to HTTP %i / %s",
    async (code, status, type) => {
      mocks.submitOrderForClinic.mockResolvedValueOnce({
        ok: false,
        error: "nope",
        code,
      } as never);
      const res = await POST(makePost(orderBody()));
      expect(res.status).toBe(status);
      const json = await res.json();
      expect(json.error.type).toBe(type);
      expect(json.error.code).toBe(code);
    },
  );

  it("accepts the Authorization: Bearer header form", async () => {
    const res = await POST(
      makePost(orderBody(), {
        "x-api-key": "",
        authorization: "Bearer lxck_testkey123",
      }),
    );
    expect(res.status).toBe(200);
  });
});

describe("GET /api/clinic/v1/products", () => {
  it("returns the clinic-priced catalog with orderability flags", async () => {
    const res = await GET_PRODUCTS(
      new NextRequest("https://logosrx.com/api/clinic/v1/products", {
        headers: { "x-api-key": "lxck_testkey123" },
      }),
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.products).toHaveLength(1);
    expect(json.products[0]).toMatchObject({
      productId: "semaglutide-glycine-2.5mg-1ml",
      orderable: true,
      priceCents: 12000,
    });
    expect(mocks.getOrderableProducts).toHaveBeenCalledWith({
      clinicId: 7,
      pricingTier: "standard",
      discountPct: 0,
    });
  });
});
