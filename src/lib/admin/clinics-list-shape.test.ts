import { describe, expect, it } from "vitest";
import { stripClinicListAggregates } from "./clinics-list-shape";

describe("stripClinicListAggregates", () => {
  it("removes window total/pending while preserving clinic fields", () => {
    const row = {
      id: 42,
      clinicName: "Harbor Wellness",
      verificationStatus: "pending" as const,
      total: 120,
      pending: 7,
    };

    expect(stripClinicListAggregates(row)).toEqual({
      id: 42,
      clinicName: "Harbor Wellness",
      verificationStatus: "pending",
    });
  });

  it("does not leak aggregate keys into the list row", () => {
    const clinic = stripClinicListAggregates({
      id: 1,
      total: 1,
      pending: 0,
    });
    expect(clinic).not.toHaveProperty("total");
    expect(clinic).not.toHaveProperty("pending");
    expect(clinic).toEqual({ id: 1 });
  });
});
