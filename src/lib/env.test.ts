import { describe, it, expect } from "vitest";
import { checkEnv } from "./env";

const FULL_PROD_ENV = {
  PGHOST: "db.example.aws.com",
  PGUSER: "logos_iam",
  PGPORT: "5432",
  AWS_REGION: "us-east-1",
  AWS_ROLE_ARN: "arn:aws:iam::123456789012:role/logos",
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_live_abc",
  CLERK_SECRET_KEY: "sk_live_abc",
  ONBOARDING_ENCRYPTION_KEY: "a-strong-secret-value-1234",
  KV_REST_API_URL: "https://kv.example.com",
} as unknown as NodeJS.ProcessEnv;

describe("checkEnv", () => {
  it("passes when all required production vars are present and valid", () => {
    const res = checkEnv(FULL_PROD_ENV, true);
    expect(res.ok).toBe(true);
    expect(res.errors).toEqual([]);
  });

  it("reports every missing required var in production", () => {
    const res = checkEnv({} as NodeJS.ProcessEnv, true);
    expect(res.ok).toBe(false);
    expect(res.errors.some((e) => e.includes("PGHOST"))).toBe(true);
    expect(res.errors.some((e) => e.includes("CLERK_SECRET_KEY"))).toBe(true);
    expect(res.errors.some((e) => e.includes("ONBOARDING_ENCRYPTION_KEY"))).toBe(
      true,
    );
  });

  it("validates formats", () => {
    const res = checkEnv(
      {
        ...FULL_PROD_ENV,
        PGPORT: "not-a-number",
        AWS_ROLE_ARN: "nope",
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "bad",
        ONBOARDING_ENCRYPTION_KEY: "short",
      } as unknown as NodeJS.ProcessEnv,
      true,
    );
    expect(res.ok).toBe(false);
    expect(res.errors.some((e) => e.includes("PGPORT"))).toBe(true);
    expect(res.errors.some((e) => e.includes("AWS_ROLE_ARN"))).toBe(true);
    expect(
      res.errors.some((e) => e.includes("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY")),
    ).toBe(true);
    expect(res.errors.some((e) => e.includes("ONBOARDING_ENCRYPTION_KEY"))).toBe(
      true,
    );
  });

  it("only enforces production-scoped vars outside production as warnings", () => {
    // Only the always-required publishable key is missing → that's an error;
    // production-only vars become dev warnings, not errors.
    const res = checkEnv(
      {
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_x",
      } as unknown as NodeJS.ProcessEnv,
      false,
    );
    expect(res.errors).toEqual([]);
    expect(res.ok).toBe(true);
    expect(res.warnings.length).toBeGreaterThan(0);
  });

  it("warns when no rate-limit backend is configured", () => {
    const env = { ...FULL_PROD_ENV };
    delete (env as Record<string, unknown>).KV_REST_API_URL;
    const res = checkEnv(env, true);
    expect(res.warnings.some((w) => w.includes("rate limiting"))).toBe(true);
  });
});
