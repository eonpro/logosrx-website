import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { isTransientConnectionError, withDbRetry } from "./retry";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("isTransientConnectionError", () => {
  it("matches direct pg-pool connect timeout messages", () => {
    expect(
      isTransientConnectionError(
        new Error("Connection terminated due to connection timeout"),
      ),
    ).toBe(true);
    expect(
      isTransientConnectionError(
        new Error("timeout exceeded when trying to connect"),
      ),
    ).toBe(true);
    expect(
      isTransientConnectionError(
        new Error("Connection terminated unexpectedly"),
      ),
    ).toBe(true);
  });

  it("matches drizzle Failed query wrappers via error.cause", () => {
    const cause = new Error("Connection terminated due to connection timeout", {
      cause: new Error("Connection terminated unexpectedly"),
    });
    const wrapped = new Error(
      'Failed query: select count(*) from "employment_applications"',
    );
    (wrapped as Error & { cause: Error }).cause = cause;

    expect(isTransientConnectionError(wrapped)).toBe(true);
  });

  it("matches transient postgres / node codes", () => {
    const err = new Error("admin shutdown") as Error & { code: string };
    err.code = "57P01";
    expect(isTransientConnectionError(err)).toBe(true);

    const reset = new Error("read ECONNRESET") as Error & { code: string };
    reset.code = "ECONNRESET";
    expect(isTransientConnectionError(reset)).toBe(true);
  });

  it("rejects real query / constraint faults", () => {
    expect(
      isTransientConnectionError(new Error("syntax error at or near")),
    ).toBe(false);

    const unique = new Error(
      "duplicate key value violates unique constraint",
    ) as Error & { code: string };
    unique.code = "23505";
    expect(isTransientConnectionError(unique)).toBe(false);

    expect(isTransientConnectionError("not an error")).toBe(false);
    expect(isTransientConnectionError(null)).toBe(false);
  });
});

describe("withDbRetry", () => {
  it("retries a transient failure and returns the next success", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(
        new Error("Connection terminated due to connection timeout"),
      )
      .mockResolvedValueOnce("ok");

    // Attach the assertion before advancing timers so rejections are handled.
    const promise = withDbRetry(fn, { retries: 2, label: "test" });
    const assertion = expect(promise).resolves.toBe("ok");
    await vi.runAllTimersAsync();
    await assertion;
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("retries through a drizzle-wrapped cause chain", async () => {
    const cause = new Error("Connection terminated unexpectedly");
    const wrapped = new Error("Failed query: select 1");
    (wrapped as Error & { cause: Error }).cause = cause;

    const fn = vi.fn().mockRejectedValueOnce(wrapped).mockResolvedValueOnce(42);

    const promise = withDbRetry(fn, { retries: 1 });
    const assertion = expect(promise).resolves.toBe(42);
    await vi.runAllTimersAsync();
    await assertion;
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("does not retry non-transient errors", async () => {
    const err = new Error("duplicate key value violates unique constraint");
    const fn = vi.fn().mockRejectedValue(err);

    await expect(withDbRetry(fn, { retries: 2 })).rejects.toBe(err);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("gives up after exhausting retries", async () => {
    const err = new Error("Connection terminated unexpectedly");
    const fn = vi.fn().mockRejectedValue(err);

    const promise = withDbRetry(fn, { retries: 2 });
    const assertion = expect(promise).rejects.toBe(err);
    await vi.runAllTimersAsync();
    await assertion;
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
