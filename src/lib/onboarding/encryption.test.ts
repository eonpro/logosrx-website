import { describe, it, expect } from "vitest";
import { encrypt, decrypt } from "./encryption";

describe("onboarding encryption", () => {
  it("round-trips a value through encrypt/decrypt", () => {
    const secret = "4111111111111111";
    const ciphertext = encrypt(secret);
    expect(ciphertext).toBeTruthy();
    expect(ciphertext).not.toContain(secret);
    expect(decrypt(ciphertext)).toBe(secret);
  });

  it("produces different ciphertext each call (random IV)", () => {
    const a = encrypt("same-value");
    const b = encrypt("same-value");
    expect(a).not.toBe(b);
    expect(decrypt(a)).toBe("same-value");
    expect(decrypt(b)).toBe("same-value");
  });

  it("returns null for empty input", () => {
    expect(encrypt("")).toBeNull();
    expect(encrypt(null)).toBeNull();
    expect(encrypt(undefined)).toBeNull();
    expect(decrypt("")).toBeNull();
    expect(decrypt(null)).toBeNull();
  });

  it("returns null for tampered/invalid ciphertext", () => {
    expect(decrypt("not-valid-base64-or-tag")).toBeNull();
    const valid = encrypt("hello");
    // Flip a character to break the auth tag.
    const tampered = (valid ?? "").slice(0, -2) + "AA";
    expect(decrypt(tampered)).toBeNull();
  });
});
