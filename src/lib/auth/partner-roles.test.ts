import { describe, expect, it } from "vitest";
import { roleAtLeast } from "./partner-roles";

describe("roleAtLeast", () => {
  it("respects the owner > admin > viewer hierarchy", () => {
    expect(roleAtLeast("owner", "admin")).toBe(true);
    expect(roleAtLeast("owner", "viewer")).toBe(true);
    expect(roleAtLeast("admin", "admin")).toBe(true);
    expect(roleAtLeast("admin", "viewer")).toBe(true);
    expect(roleAtLeast("viewer", "viewer")).toBe(true);
  });

  it("rejects roles below the minimum", () => {
    expect(roleAtLeast("viewer", "admin")).toBe(false);
    expect(roleAtLeast("admin", "owner")).toBe(false);
    expect(roleAtLeast("viewer", "owner")).toBe(false);
  });

  it("treats null/undefined (e.g. reps) as not meeting any minimum", () => {
    expect(roleAtLeast(null, "viewer")).toBe(false);
    expect(roleAtLeast(undefined, "viewer")).toBe(false);
  });
});
