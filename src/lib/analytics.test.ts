import { afterEach, describe, expect, it, vi } from "vitest";

const { amplitudeInit, amplitudeTrack } = vi.hoisted(() => ({
  amplitudeInit: vi.fn(),
  amplitudeTrack: vi.fn(),
}));

vi.mock("@amplitude/analytics-browser", () => ({
  init: amplitudeInit,
  track: amplitudeTrack,
}));

/**
 * `GA_ID` / `AMPLITUDE_API_KEY` / `VITALS_ENDPOINT` are captured from env at
 * module load, so each test stubs env, then `resetModules()` + dynamic
 * `import()` to get a fresh copy.
 */
async function loadAnalytics() {
  vi.resetModules();
  return import("./analytics");
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
  vi.clearAllMocks();
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

  it("does not load or init Amplitude when its key is unset", async () => {
    vi.stubEnv("NEXT_PUBLIC_AMPLITUDE_API_KEY", "");
    const mod = await loadAnalytics();

    expect(mod.amplitudeEnabled()).toBe(false);
    expect(await mod.initAmplitude()).toBeNull();
    mod.track("cta_call");
    await Promise.resolve();
    expect(amplitudeInit).not.toHaveBeenCalled();
    expect(amplitudeTrack).not.toHaveBeenCalled();
  });

  it("initializes Amplitude once and mirrors tracked events when configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_AMPLITUDE_API_KEY", "amp-test-key");
    const mod = await loadAnalytics();

    expect(mod.amplitudeEnabled()).toBe(true);
    await mod.initAmplitude();
    await mod.initAmplitude(); // memoized — must not re-init
    expect(amplitudeInit).toHaveBeenCalledTimes(1);
    expect(amplitudeInit).toHaveBeenCalledWith(
      "amp-test-key",
      expect.objectContaining({
        autocapture: expect.objectContaining({
          pageViews: true,
          formInteractions: false,
          elementInteractions: false,
        }),
      }),
    );

    mod.track("cta_onboarding_start", { location: "test" });
    await vi.waitFor(() =>
      expect(amplitudeTrack).toHaveBeenCalledWith("cta_onboarding_start", {
        location: "test",
      }),
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
