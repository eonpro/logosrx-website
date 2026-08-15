import { afterEach, describe, expect, it, vi } from "vitest";

const fetchClerkPrimaryEmail = vi.hoisted(() => vi.fn());

vi.mock("./clerk-primary-email", () => ({
  fetchClerkPrimaryEmail,
}));

afterEach(() => {
  fetchClerkPrimaryEmail.mockReset();
  vi.unstubAllEnvs();
  vi.resetModules();
});

async function loadGate() {
  vi.stubEnv("ADMIN_EMAILS", "admin@logosrx.com");
  vi.stubEnv("ADMIN_VIEWER_EMAILS", "viewer@logosrx.com");
  vi.resetModules();
  vi.doMock("./clerk-primary-email", () => ({
    fetchClerkPrimaryEmail,
  }));
  return import("./admin-gate");
}

describe("resolveAdminGate", () => {
  it("accepts an allowlisted JWT claim without calling Clerk", async () => {
    const { resolveAdminGate } = await loadGate();
    const result = await resolveAdminGate(
      "user_1",
      { email: "admin@logosrx.com" },
      undefined,
    );
    expect(result.status).toBe("allow");
    if (result.status === "allow") {
      expect(result.email).toBe("admin@logosrx.com");
      expect(result.setCookie).toBe(true);
    }
    expect(fetchClerkPrimaryEmail).not.toHaveBeenCalled();
  });

  it("rejects a signed-in user who is not allowlisted", async () => {
    const { resolveAdminGate } = await loadGate();
    fetchClerkPrimaryEmail.mockResolvedValue("stranger@example.com");
    const result = await resolveAdminGate(
      "user_1",
      { email: "stranger@example.com" },
      undefined,
    );
    expect(result).toEqual({ status: "deny" });
  });

  it("falls back to Clerk only when claims and cookie are missing", async () => {
    const { resolveAdminGate } = await loadGate();
    fetchClerkPrimaryEmail.mockResolvedValue("admin@logosrx.com");
    const result = await resolveAdminGate("user_1", {}, undefined);
    expect(result.status).toBe("allow");
    if (result.status === "allow") {
      expect(result.email).toBe("admin@logosrx.com");
      expect(result.setCookie).toBe(true);
    }
    expect(fetchClerkPrimaryEmail).toHaveBeenCalledOnce();
  });

  it("returns unknown when Clerk cannot resolve an email", async () => {
    const { resolveAdminGate } = await loadGate();
    fetchClerkPrimaryEmail.mockResolvedValue(null);
    const result = await resolveAdminGate("user_1", {}, undefined);
    expect(result).toEqual({ status: "unknown" });
  });
});
