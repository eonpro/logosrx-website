import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/db", () => ({ db: {} }));

import { clinicKeyToken, hashClinicApiKey, mintClinicApiKey } from "./api-auth";

function headersOf(record: Record<string, string>) {
  const lower = Object.fromEntries(
    Object.entries(record).map(([k, v]) => [k.toLowerCase(), v]),
  );
  return { get: (name: string) => lower[name.toLowerCase()] ?? null };
}

describe("mintClinicApiKey", () => {
  it("mints lxck_ keys with matching prefix and hash", () => {
    const minted = mintClinicApiKey();
    expect(minted.plaintext).toMatch(/^lxck_[A-Za-z0-9_-]{32}$/);
    expect(minted.keyPrefix).toBe(minted.plaintext.slice(0, 12));
    expect(minted.keyHash).toBe(hashClinicApiKey(minted.plaintext));
    expect(minted.keyHash).toMatch(/^[0-9a-f]{64}$/);
  });

  it("mints unique keys", () => {
    expect(mintClinicApiKey().plaintext).not.toBe(mintClinicApiKey().plaintext);
  });
});

describe("clinicKeyToken", () => {
  it("extracts from Authorization: Bearer", () => {
    expect(
      clinicKeyToken(headersOf({ Authorization: "Bearer lxck_abc123" })),
    ).toBe("lxck_abc123");
  });

  it("extracts from X-Api-Key", () => {
    expect(clinicKeyToken(headersOf({ "X-Api-Key": "lxck_abc123" }))).toBe(
      "lxck_abc123",
    );
  });

  it("prefers Authorization when both are present", () => {
    expect(
      clinicKeyToken(
        headersOf({
          Authorization: "Bearer lxck_from_auth",
          "X-Api-Key": "lxck_from_header",
        }),
      ),
    ).toBe("lxck_from_auth");
  });

  it("rejects non-lxck tokens and missing headers", () => {
    expect(
      clinicKeyToken(headersOf({ Authorization: "Bearer lxpk_partner" })),
    ).toBeNull();
    expect(clinicKeyToken(headersOf({ "X-Api-Key": "nope" }))).toBeNull();
    expect(clinicKeyToken(headersOf({}))).toBeNull();
  });
});
