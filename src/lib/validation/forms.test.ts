import { describe, it, expect } from "vitest";
import {
  parseForm,
  emailSignupSchema,
  clinicSignupSchema,
  partnerApplicationSchema,
  employmentApplicationSchema,
} from "./forms";

describe("emailSignupSchema", () => {
  it("trims and lowercases a valid email", () => {
    const r = parseForm(emailSignupSchema, { email: "  Foo@Bar.com " });
    expect(r).toEqual({ ok: true, data: { email: "foo@bar.com" } });
  });

  it("rejects a missing email with a friendly message", () => {
    const r = parseForm(emailSignupSchema, {});
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("Email is required.");
  });

  it("rejects a malformed email", () => {
    const r = parseForm(emailSignupSchema, { email: "not-an-email" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("Invalid email address.");
  });

  it("rejects an over-long email", () => {
    const r = parseForm(emailSignupSchema, {
      email: `${"a".repeat(300)}@x.com`,
    });
    expect(r.ok).toBe(false);
  });
});

describe("clinicSignupSchema", () => {
  it("accepts a complete submission and nulls empty optionals", () => {
    const r = parseForm(clinicSignupSchema, {
      clinicName: " Acme Clinic ",
      contactName: "Jane Doe",
      email: "jane@acme.com",
      phone: "555-123-4567",
      npiNumber: "",
      state: "  ",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.clinicName).toBe("Acme Clinic");
      expect(r.data.npiNumber).toBeNull();
      expect(r.data.state).toBeNull();
      expect(r.data.specialty).toBeNull();
      expect(r.data.message).toBeNull();
    }
  });

  it("requires the core contact fields", () => {
    const r = parseForm(clinicSignupSchema, { clinicName: "Acme" });
    expect(r.ok).toBe(false);
  });

  it("rejects an over-long optional field instead of silently dropping it", () => {
    const r = parseForm(clinicSignupSchema, {
      clinicName: "Acme",
      contactName: "Jane",
      email: "jane@acme.com",
      phone: "5551234567",
      message: "x".repeat(5000),
    });
    expect(r.ok).toBe(false);
  });
});

describe("partnerApplicationSchema", () => {
  it("requires a phone with at least 7 digits", () => {
    const r = parseForm(partnerApplicationSchema, {
      orgName: "Org",
      contactName: "Jane",
      email: "jane@org.com",
      phone: "123",
      website: "",
      notes: "",
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toBe("Please enter a valid phone number.");
  });

  it("accepts a valid application", () => {
    const r = parseForm(partnerApplicationSchema, {
      orgName: "Org",
      contactName: "Jane",
      email: "JANE@ORG.com",
      phone: "(555) 123-4567",
      website: " https://org.com ",
      notes: "",
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.email).toBe("jane@org.com");
      expect(r.data.website).toBe("https://org.com");
      expect(r.data.notes).toBeNull();
    }
  });
});

describe("employmentApplicationSchema", () => {
  it("requires the core fields", () => {
    const r = parseForm(employmentApplicationSchema, {
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@x.com",
      // phone + position missing
    });
    expect(r.ok).toBe(false);
  });
});
