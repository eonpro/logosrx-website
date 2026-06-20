import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * `GA_ID` / `VITALS_ENDPOINT` are captured from env at module load, so each test
 * stubs env, then `resetModules()` + dynamic `import()` to get a fresh copy.
 */
async function loadAnalytics() {
  vi.resetModules();
  return import("./analytics");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
  delete (window as unknown as { gtag?: unknown }).gtag;
});

describe("analytics", () => {
  it("is disabled and no-ops when GA id is unset", async () => {
    vi.stubEnv("NEXT_PUBLIC_GA_ID", "");
    const mod = await loadAnalytics();
    expect(mod.analyticsEnabled()).toBe(false);

    const gtag = vi.fn();
    (window as unknown as { gtag: typeof gtag }).gtag = gtag;
    mod.track("cta_call");
    expect(gtag).not.toHaveBeenCalled();
  });

  it("enables and fires typed events when GA id is set", async () => {
    vi.stubEnv("NEXT_PUBLIC_GA_ID", "G-TEST123");
    const mod = await loadAnalytics();
    expect(mod.analyticsEnabled()).toBe(true);

    const gtag = vi.fn();
    (window as unknown as { gtag: typeof gtag }).gtag = gtag;
    mod.track("cta_onboarding_start", { location: "test" });
    expect(gtag).toHaveBeenCalledWith("event", "cta_onboarding_start", {
      location: "test",
    });
  });

  it("scales CLS to an integer and marks it non-interaction for GA4", async () => {
    vi.stubEnv("NEXT_PUBLIC_GA_ID", "G-TEST123");
    const mod = await loadAnalytics();

    const gtag = vi.fn();
    (window as unknown as { gtag: typeof gtag }).gtag = gtag;
    mod.reportWebVital({ id: "v1", name: "CLS", value: 0.1234, rating: "good" });

    expect(gtag).toHaveBeenCalledWith(
      "event",
      "CLS",
      expect.objectContaining({ value: 123, non_interaction: true }),
    );
  });

  it("beacons raw Web Vitals to a custom RUM endpoint when configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_GA_ID", "");
    vi.stubEnv("NEXT_PUBLIC_VITALS_ENDPOINT", "https://rum.example.com/collect");
    const mod = await loadAnalytics();

    const sendBeacon = vi.fn().mockReturnValue(true);
    vi.stubGlobal("navigator", { sendBeacon });
    mod.reportWebVital({ id: "v2", name: "LCP", value: 2412.7 });

    expect(sendBeacon).toHaveBeenCalledWith(
      "https://rum.example.com/collect",
      expect.stringContaining("LCP"),
    );
  });
});
