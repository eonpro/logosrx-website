import { describe, expect, it } from "vitest";
import {
  clinicStatusLabel,
  shouldShowPricingUpdatedBanner,
} from "./status";

describe("clinicStatusLabel", () => {
  it("maps statuses for the clinic portal", () => {
    expect(clinicStatusLabel("pending")).toBe("Pending");
    expect(clinicStatusLabel("reviewed")).toBe("In review");
    expect(clinicStatusLabel("closed")).toBe("Completed");
  });
});

describe("shouldShowPricingUpdatedBanner", () => {
  const notified = new Date("2026-07-25T12:00:00.000Z");

  it("hides when there is no notification", () => {
    expect(
      shouldShowPricingUpdatedBanner({
        latestNotifiedAt: null,
        pricingUpdateSeenAt: null,
      }),
    ).toBe(false);
  });

  it("shows when notified and never dismissed", () => {
    expect(
      shouldShowPricingUpdatedBanner({
        latestNotifiedAt: notified,
        pricingUpdateSeenAt: null,
      }),
    ).toBe(true);
  });

  it("hides when dismissed after the notification", () => {
    expect(
      shouldShowPricingUpdatedBanner({
        latestNotifiedAt: notified,
        pricingUpdateSeenAt: new Date("2026-07-25T13:00:00.000Z"),
      }),
    ).toBe(false);
  });

  it("shows again when a newer notification arrives after dismiss", () => {
    expect(
      shouldShowPricingUpdatedBanner({
        latestNotifiedAt: new Date("2026-07-26T10:00:00.000Z"),
        pricingUpdateSeenAt: new Date("2026-07-25T13:00:00.000Z"),
      }),
    ).toBe(true);
  });

  it("accepts ISO strings from RSC serialization", () => {
    expect(
      shouldShowPricingUpdatedBanner({
        latestNotifiedAt: notified.toISOString(),
        pricingUpdateSeenAt: null,
      }),
    ).toBe(true);
  });
});
