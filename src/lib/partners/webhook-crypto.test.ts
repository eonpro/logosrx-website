import { describe, expect, it } from "vitest";
import {
  generateWebhookSecret,
  isWebhookEvent,
  signatureHeader,
  signWebhookBody,
} from "./webhook-crypto";

describe("webhook signing", () => {
  it("is deterministic for the same secret/body/timestamp", () => {
    const a = signWebhookBody("whsec_x", '{"a":1}', 1000);
    const b = signWebhookBody("whsec_x", '{"a":1}', 1000);
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it("changes with body, timestamp, or secret", () => {
    const base = signWebhookBody("whsec_x", "body", 1000);
    expect(signWebhookBody("whsec_x", "body2", 1000)).not.toBe(base);
    expect(signWebhookBody("whsec_x", "body", 1001)).not.toBe(base);
    expect(signWebhookBody("whsec_y", "body", 1000)).not.toBe(base);
  });

  it("formats the signature header as t=<ts>,v1=<hex>", () => {
    const h = signatureHeader("whsec_x", "body", 1700000000);
    expect(h).toMatch(/^t=1700000000,v1=[a-f0-9]{64}$/);
  });
});

describe("generateWebhookSecret", () => {
  it("is prefixed and unique", () => {
    const a = generateWebhookSecret();
    const b = generateWebhookSecret();
    expect(a.startsWith("whsec_")).toBe(true);
    expect(a).not.toBe(b);
  });
});

describe("isWebhookEvent", () => {
  it("accepts known events and rejects others", () => {
    expect(isWebhookEvent("transaction.recorded")).toBe(true);
    expect(isWebhookEvent("clinic.attributed")).toBe(true);
    expect(isWebhookEvent("payout.recorded")).toBe(true);
    expect(isWebhookEvent("bogus.event")).toBe(false);
  });
});
