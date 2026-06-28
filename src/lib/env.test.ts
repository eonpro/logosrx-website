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
  KV_REST_API_TOKEN: "kv-token",
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
    delete (env as Record<string, unknown>).KV_REST_API_TOKEN;
    const res = checkEnv(env, true);
    expect(res.warnings.some((w) => w.includes("rate limiting"))).toBe(true);
  });

  it("requires a companion var when its partner is set", () => {
    const env = { ...FULL_PROD_ENV };
    delete (env as Record<string, unknown>).KV_REST_API_TOKEN;
    const res = checkEnv(env, true);
    expect(res.ok).toBe(false);
    expect(res.errors.some((e) => e.includes("KV_REST_API_TOKEN"))).toBe(true);
  });

  it("requires a download token when a catalog PDF URL is set", () => {
    const res = checkEnv(
      {
        ...FULL_PROD_ENV,
        CATALOG_PDF_URL: "https://blob.example/catalog.pdf",
      } as unknown as NodeJS.ProcessEnv,
      true,
    );
    expect(res.ok).toBe(false);
    expect(res.errors.some((e) => e.includes("CATALOG_DOWNLOAD_TOKEN"))).toBe(
      true,
    );
  });

  it("requires both SES keys together", () => {
    const res = checkEnv(
      {
        ...FULL_PROD_ENV,
        SES_ACCESS_KEY_ID: "AKIA...",
      } as unknown as NodeJS.ProcessEnv,
      true,
    );
    expect(res.ok).toBe(false);
    expect(res.errors.some((e) => e.includes("SES_SECRET_ACCESS_KEY"))).toBe(
      true,
    );
  });

  it("format-checks optional vars only when present", () => {
    const ok = checkEnv(FULL_PROD_ENV, true);
    expect(ok.ok).toBe(true);

    const bad = checkEnv(
      {
        ...FULL_PROD_ENV,
        NEXT_PUBLIC_SITE_URL: "not-a-url",
        LOG_LEVEL: "verbose",
        SLOW_OP_MS: "fast",
        EMAIL_FROM: "nope",
      } as unknown as NodeJS.ProcessEnv,
      true,
    );
    expect(bad.ok).toBe(false);
    expect(bad.errors.some((e) => e.includes("NEXT_PUBLIC_SITE_URL"))).toBe(true);
    expect(bad.errors.some((e) => e.includes("LOG_LEVEL"))).toBe(true);
    expect(bad.errors.some((e) => e.includes("SLOW_OP_MS"))).toBe(true);
    expect(bad.errors.some((e) => e.includes("EMAIL_FROM"))).toBe(true);
  });

  it("warns in production about missing Sentry/admin/email config", () => {
    const res = checkEnv(FULL_PROD_ENV, true);
    expect(res.warnings.some((w) => w.includes("Sentry"))).toBe(true);
    expect(res.warnings.some((w) => w.includes("/admin portal"))).toBe(true);
    expect(res.warnings.some((w) => w.includes("transactional email"))).toBe(
      true,
    );
  });

  it("suppresses prod-only warnings outside production", () => {
    const res = checkEnv(
      { NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: "pk_test_x" } as unknown as NodeJS.ProcessEnv,
      false,
    );
    expect(res.warnings.some((w) => w.includes("Sentry"))).toBe(false);
    expect(res.warnings.some((w) => w.includes("/admin portal"))).toBe(false);
  });
});
