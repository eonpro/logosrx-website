import { describe, expect, it } from "vitest";
import { toOverviewStats } from "./overview-stats-shape";

describe("toOverviewStats", () => {
  it("coerces numeric strings and fills missing counts with 0", () => {
    expect(
      toOverviewStats({
        apps_total: "3",
        apps_new: 1,
        accounts_total: 12,
      }),
    ).toEqual({
      applications: { total: 3, new: 1 },
      accounts: { total: 12, pending: 0 },
      clinics: { total: 0, new: 0 },
      emails: { total: 0 },
      merchandising: { total: 0, featured: 0 },
      quotes: { total: 0, active: 0 },
      pricingRequests: { pending: 0 },
    });
  });

  it("treats garbage values as 0", () => {
    expect(toOverviewStats({ apps_total: "nope", emails_total: NaN })).toEqual({
      applications: { total: 0, new: 0 },
      accounts: { total: 0, pending: 0 },
      clinics: { total: 0, new: 0 },
      emails: { total: 0 },
      merchandising: { total: 0, featured: 0 },
      quotes: { total: 0, active: 0 },
      pricingRequests: { pending: 0 },
    });
  });
});
