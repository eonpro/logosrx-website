import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

/**
 * Integration tests for the admin invoice-upload route handler. Auth, blob
 * storage, and the transaction library are stubbed so the test exercises the
 * real branching: origin → admin gate → file validation → field validation →
 * blob put → transaction create (with compensating delete on failure).
 */
// Stand-ins for the real error classes: the module imports "server-only" and
// the DB pool, so the whole thing is mocked rather than partially overridden.
const errors = vi.hoisted(() => {
  class TransactionError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "TransactionError";
    }
  }
  class DuplicateReferenceError extends Error {
    constructor(public readonly reference: string) {
      super(`A transaction with reference "${reference}" already exists.`);
      this.name = "DuplicateReferenceError";
    }
  }
  return { TransactionError, DuplicateReferenceError };
});

const mocks = vi.hoisted(() => ({
  checkSameOrigin: vi.fn(() => ({ ok: true })),
  requireAdmin: vi.fn(async () => ({
    userId: "user_admin",
    email: "admin@logosrx.com",
    role: "admin",
  })),
  put: vi.fn<
    (
      pathname: string,
      file: File,
      options: { access: string; contentType: string },
    ) => Promise<{ pathname: string; url: string }>
  >(async (pathname) => ({
    pathname,
    url: `https://blob.example/${pathname}`,
  })),
  del: vi.fn(async () => {}),
  createTransactionWithCommission: vi.fn(async () => 77),
  recordAdminAudit: vi.fn(async () => {}),
}));

vi.mock("@/lib/security/origin", () => ({
  checkSameOrigin: mocks.checkSameOrigin,
}));

vi.mock("@/lib/auth/admin", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/admin")>();
  return { ...actual, requireAdmin: mocks.requireAdmin };
});

vi.mock("@vercel/blob", () => ({
  put: mocks.put,
  del: mocks.del,
}));

vi.mock("@/lib/audit/log", () => ({
  recordAdminAudit: mocks.recordAdminAudit,
}));

vi.mock("@/lib/partners/transactions", () => ({
  createTransactionWithCommission: mocks.createTransactionWithCommission,
  TransactionError: errors.TransactionError,
  DuplicateReferenceError: errors.DuplicateReferenceError,
}));

import { POST } from "@/app/api/admin/invoices/route";

const { TransactionError, DuplicateReferenceError } = errors;

const PDF_BYTES = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]);

function makeForm(overrides: Partial<Record<string, string | File>> = {}) {
  const form = new FormData();
  const defaults: Record<string, string | File> = {
    file: new File([PDF_BYTES], "invoice.pdf", { type: "application/pdf" }),
    clinicId: "42",
    dateIso: "2026-07-22",
    amountDollars: "210.00",
    costDollars: "",
    reference: "103550076",
    description: "Tirzepatide order",
    ...overrides,
  };
  for (const [key, value] of Object.entries(defaults)) {
    if (value !== undefined) form.append(key, value);
  }
  return form;
}

function makeReq(form: FormData) {
  return new NextRequest("https://logosrx.com/api/admin/invoices", {
    method: "POST",
    headers: { origin: "https://logosrx.com" },
    body: form,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.checkSameOrigin.mockReturnValue({ ok: true });
  mocks.createTransactionWithCommission.mockResolvedValue(77);
});

describe("POST /api/admin/invoices", () => {
  it("uploads the PDF and records the transaction", async () => {
    const res = await POST(makeReq(makeForm()));
    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toEqual({
      success: true,
      transactionId: 77,
    });

    expect(mocks.put).toHaveBeenCalledTimes(1);
    const [pathname, , options] = mocks.put.mock.calls[0];
    expect(pathname).toMatch(/^invoices\/[0-9a-f-]{36}\/invoice\.pdf$/);
    expect(options.access).toBe("private");
    expect(options.contentType).toBe("application/pdf");

    expect(mocks.createTransactionWithCommission).toHaveBeenCalledWith(
      expect.objectContaining({
        clinicId: 42,
        revenueCents: 21000,
        source: "invoice",
        reference: "103550076",
        invoicePathname: pathname,
        invoiceFilename: "invoice.pdf",
        createdBy: "user_admin",
      }),
    );
    expect(mocks.recordAdminAudit).toHaveBeenCalledTimes(1);
  });

  it("rejects non-PDF bytes even with a pdf filename and MIME", async () => {
    const exe = new File([new Uint8Array([0x4d, 0x5a, 0x90, 0x00])], "invoice.pdf", {
      type: "application/pdf",
    });
    const res = await POST(makeReq(makeForm({ file: exe })));
    expect(res.status).toBe(400);
    expect(mocks.put).not.toHaveBeenCalled();
    expect(mocks.createTransactionWithCommission).not.toHaveBeenCalled();
  });

  it("requires a clinic", async () => {
    const res = await POST(makeReq(makeForm({ clinicId: "" })));
    expect(res.status).toBe(400);
    expect(mocks.put).not.toHaveBeenCalled();
  });

  it("requires a valid amount", async () => {
    const res = await POST(makeReq(makeForm({ amountDollars: "abc" })));
    expect(res.status).toBe(400);
    expect(mocks.put).not.toHaveBeenCalled();
  });

  it("deletes the uploaded blob when the transaction fails", async () => {
    mocks.createTransactionWithCommission.mockRejectedValueOnce(
      new TransactionError("This clinic isn't attributed to a partner."),
    );
    const res = await POST(makeReq(makeForm()));
    expect(res.status).toBe(400);
    expect(mocks.del).toHaveBeenCalledTimes(1);
  });

  it("returns 409 and cleans up on a duplicate reference", async () => {
    mocks.createTransactionWithCommission.mockRejectedValueOnce(
      new DuplicateReferenceError("103550076"),
    );
    const res = await POST(makeReq(makeForm()));
    expect(res.status).toBe(409);
    expect(mocks.del).toHaveBeenCalledTimes(1);
  });

  it("blocks cross-origin requests", async () => {
    mocks.checkSameOrigin.mockReturnValue({ ok: false });
    const res = await POST(makeReq(makeForm()));
    expect(res.status).toBe(403);
    expect(mocks.put).not.toHaveBeenCalled();
  });
});
