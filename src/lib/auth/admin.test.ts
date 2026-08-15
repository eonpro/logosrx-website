import { describe, expect, it } from "vitest";
import { emailFromSessionClaims } from "./admin-claims";

describe("emailFromSessionClaims", () => {
  it("reads common Clerk claim keys", () => {
    expect(emailFromSessionClaims({ email: "a@logosrx.com" })).toBe(
      "a@logosrx.com",
    );
    expect(
      emailFromSessionClaims({ primary_email: "b@logosrx.com" }),
    ).toBe("b@logosrx.com");
    expect(
      emailFromSessionClaims({ primary_email_address: "c@logosrx.com" }),
    ).toBe("c@logosrx.com");
    expect(
      emailFromSessionClaims({ email_address: "d@logosrx.com" }),
    ).toBe("d@logosrx.com");
  });

  it("reads nested user.email and user.primary_email_address", () => {
    expect(
      emailFromSessionClaims({ user: { email: "nested@logosrx.com" } }),
    ).toBe("nested@logosrx.com");
    expect(
      emailFromSessionClaims({
        user: { primary_email_address: "nested2@logosrx.com" },
      }),
    ).toBe("nested2@logosrx.com");
  });

  it("rejects missing, non-email, and non-object claims", () => {
    expect(emailFromSessionClaims(null)).toBeNull();
    expect(emailFromSessionClaims(undefined)).toBeNull();
    expect(emailFromSessionClaims("a@logosrx.com")).toBeNull();
    expect(emailFromSessionClaims({ email: "not-an-email" })).toBeNull();
    expect(emailFromSessionClaims({ email: 12 })).toBeNull();
    expect(emailFromSessionClaims({})).toBeNull();
  });
});
