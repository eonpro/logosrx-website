import { describe, expect, it } from "vitest";
import {
  signAdminSession,
  verifyAdminSession,
  shouldRefreshAdminSession,
  ADMIN_SESSION_TTL_SECONDS,
} from "./admin-session";

describe("admin session cookie", () => {
  it("round-trips a signed payload bound to the user", async () => {
    const token = await signAdminSession("user_1", "Admin@LogosRX.com");
    const parsed = await verifyAdminSession(token, "user_1");
    expect(parsed).toEqual({
      userId: "user_1",
      email: "admin@logosrx.com",
      exp: expect.any(Number),
    });
    expect(parsed!.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it("rejects a token for a different user", async () => {
    const token = await signAdminSession("user_1", "a@logosrx.com");
    expect(await verifyAdminSession(token, "user_2")).toBeNull();
  });

  it("rejects a tampered payload", async () => {
    const token = await signAdminSession("user_1", "a@logosrx.com");
    const [body, mac] = token.split(".");
    const tampered = `x${body.slice(1)}.${mac}`;
    expect(await verifyAdminSession(tampered, "user_1")).toBeNull();
  });

  it("rejects missing or malformed values", async () => {
    expect(await verifyAdminSession(undefined, "user_1")).toBeNull();
    expect(await verifyAdminSession("", "user_1")).toBeNull();
    expect(await verifyAdminSession("no-dot", "user_1")).toBeNull();
  });

  it("does not refresh a freshly signed session", async () => {
    const token = await signAdminSession("user_1", "a@logosrx.com");
    const parsed = await verifyAdminSession(token, "user_1");
    expect(parsed).not.toBeNull();
    expect(shouldRefreshAdminSession(parsed!)).toBe(false);
  });

  it("refreshes a session near expiry", async () => {
    const token = await signAdminSession("user_1", "a@logosrx.com", 60);
    const parsed = await verifyAdminSession(token, "user_1");
    expect(parsed).not.toBeNull();
    expect(shouldRefreshAdminSession(parsed!)).toBe(true);
    expect(ADMIN_SESSION_TTL_SECONDS).toBeGreaterThan(60);
  });
});
