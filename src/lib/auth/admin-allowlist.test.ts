import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("roleForEmail", () => {
  it("returns null when no allowlist is configured", async () => {
    vi.stubEnv("ADMIN_EMAILS", "");
    vi.stubEnv("ADMIN_VIEWER_EMAILS", "");
    const { roleForEmail } = await import("./admin-allowlist");
    expect(roleForEmail("anyone@logosrx.com")).toBeNull();
    expect(roleForEmail(null)).toBeNull();
  });

  it("maps admin and viewer emails (case-insensitive)", async () => {
    vi.stubEnv("ADMIN_EMAILS", "admin@logosrx.com");
    vi.stubEnv("ADMIN_VIEWER_EMAILS", "viewer@logosrx.com");
    const { roleForEmail } = await import("./admin-allowlist");
    expect(roleForEmail("Admin@LogosRX.com")).toBe("admin");
    expect(roleForEmail("viewer@logosrx.com")).toBe("viewer");
    expect(roleForEmail("other@logosrx.com")).toBeNull();
  });
});
