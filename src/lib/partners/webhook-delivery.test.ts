import { describe, expect, it, vi } from "vitest";
import { deliverSignedWebhook } from "./webhook-delivery";
import { backoffMs, isRetryableStatus } from "./webhook-crypto";

const target = { url: "https://example.test/hook", secret: "whsec_x" };
const noSleep = () => Promise.resolve();

/** Build a fake fetch that returns the given statuses in sequence. */
function fetchReturning(...statuses: number[]) {
  let i = 0;
  const calls: Array<{ url: string; headers: Record<string, string>; body: string }> = [];
  const impl = vi.fn(async (url: string, init: RequestInit) => {
    calls.push({
      url,
      headers: init.headers as Record<string, string>,
      body: init.body as string,
    });
    const status = statuses[Math.min(i, statuses.length - 1)];
    i++;
    return { ok: status >= 200 && status < 300, status } as Response;
  });
  return { impl: impl as unknown as typeof fetch, calls };
}

/** Build a fake fetch that throws (network error) N times then succeeds. */
function fetchThrowingThenOk(throwCount: number) {
  let i = 0;
  const impl = vi.fn(async () => {
    if (i++ < throwCount) throw new Error("ECONNRESET");
    return { ok: true, status: 200 } as Response;
  });
  return impl as unknown as typeof fetch;
}

describe("isRetryableStatus", () => {
  it("retries network errors, 429, and 5xx only", () => {
    expect(isRetryableStatus(0)).toBe(true);
    expect(isRetryableStatus(429)).toBe(true);
    expect(isRetryableStatus(500)).toBe(true);
    expect(isRetryableStatus(503)).toBe(true);
    expect(isRetryableStatus(200)).toBe(false);
    expect(isRetryableStatus(400)).toBe(false);
    expect(isRetryableStatus(404)).toBe(false);
  });
});

describe("backoffMs", () => {
  it("grows exponentially and caps at 30s", () => {
    expect(backoffMs(1)).toBe(500);
    expect(backoffMs(2)).toBe(2_000);
    expect(backoffMs(3)).toBe(8_000);
    expect(backoffMs(10)).toBe(30_000);
  });
});

describe("deliverSignedWebhook", () => {
  it("delivers on the first 2xx", async () => {
    const { impl, calls } = fetchReturning(200);
    const result = await deliverSignedWebhook(target, "transaction.recorded", "{}", "id-1", {
      fetchImpl: impl,
      sleep: noSleep,
    });
    expect(result).toMatchObject({ delivered: true, attempts: 1, lastStatus: 200 });
    expect(calls).toHaveLength(1);
  });

  it("sends a stable idempotency key on every attempt", async () => {
    const { impl, calls } = fetchReturning(500, 200);
    await deliverSignedWebhook(target, "payout.recorded", "{}", "stable-id", {
      fetchImpl: impl,
      sleep: noSleep,
    });
    expect(calls).toHaveLength(2);
    expect(calls[0].headers["X-Logos-Delivery-Id"]).toBe("stable-id");
    expect(calls[1].headers["X-Logos-Delivery-Id"]).toBe("stable-id");
    expect(calls[0].headers["X-Logos-Event"]).toBe("payout.recorded");
  });

  it("retries transient 5xx then succeeds", async () => {
    const { impl } = fetchReturning(503, 503, 200);
    const result = await deliverSignedWebhook(target, "transaction.recorded", "{}", "id", {
      fetchImpl: impl,
      sleep: noSleep,
    });
    expect(result).toMatchObject({ delivered: true, attempts: 3, lastStatus: 200 });
  });

  it("dead-letters after exhausting attempts on persistent 5xx", async () => {
    const { impl, calls } = fetchReturning(500);
    const result = await deliverSignedWebhook(target, "transaction.recorded", "{}", "id", {
      fetchImpl: impl,
      sleep: noSleep,
      maxAttempts: 4,
    });
    expect(result.delivered).toBe(false);
    expect(result.attempts).toBe(4);
    expect(result.lastStatus).toBe(500);
    expect(calls).toHaveLength(4);
  });

  it("does not retry permanent 4xx", async () => {
    const { impl, calls } = fetchReturning(400);
    const result = await deliverSignedWebhook(target, "transaction.recorded", "{}", "id", {
      fetchImpl: impl,
      sleep: noSleep,
    });
    expect(result.delivered).toBe(false);
    expect(result.attempts).toBe(1);
    expect(result.lastStatus).toBe(400);
    expect(calls).toHaveLength(1);
  });

  it("retries network errors then succeeds", async () => {
    const impl = fetchThrowingThenOk(2);
    const result = await deliverSignedWebhook(target, "transaction.recorded", "{}", "id", {
      fetchImpl: impl,
      sleep: noSleep,
    });
    expect(result).toMatchObject({ delivered: true, attempts: 3, lastStatus: 200 });
  });

  it("reports the last error when all attempts are network failures", async () => {
    const impl = vi.fn(async () => {
      throw new Error("ETIMEDOUT");
    }) as unknown as typeof fetch;
    const result = await deliverSignedWebhook(target, "transaction.recorded", "{}", "id", {
      fetchImpl: impl,
      sleep: noSleep,
      maxAttempts: 2,
    });
    expect(result.delivered).toBe(false);
    expect(result.lastStatus).toBe(0);
    expect(result.lastError).toBe("ETIMEDOUT");
  });
});
