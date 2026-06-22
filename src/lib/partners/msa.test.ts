import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  MSA_TITLE,
  MSA_VERSION,
  msaSections,
  renderMsaText,
  type MsaFieldValues,
} from "./msa";

const sample: MsaFieldValues = {
  effectiveDate: "January 1, 2026",
  legalEntityName: "Acme Marketing LLC",
  entityAddress: "123 Main St, City, ST 00000",
  entityState: "Delaware",
};

describe("MSA content module", () => {
  it("interpolates the signer-supplied values into the document", () => {
    const text = renderMsaText(sample);
    expect(text).toContain("Acme Marketing LLC");
    expect(text).toContain("Delaware");
    expect(text).toContain("123 Main St, City, ST 00000");
    expect(text).toContain("January 1, 2026");
    expect(text).toContain(MSA_TITLE);
    expect(text).toContain(MSA_VERSION);
  });

  it("renders blanks for missing values rather than 'undefined'", () => {
    const text = renderMsaText({
      effectiveDate: "",
      legalEntityName: "",
    });
    expect(text).not.toContain("undefined");
    expect(text).toContain("________________");
  });

  it("is deterministic so the hash is reproducible", () => {
    const a = renderMsaText(sample);
    const b = renderMsaText({ ...sample });
    expect(a).toBe(b);
    const hashA = createHash("sha256").update(a, "utf8").digest("hex");
    const hashB = createHash("sha256").update(b, "utf8").digest("hex");
    expect(hashA).toBe(hashB);
    expect(hashA).toHaveLength(64);
  });

  it("changes the hash when the entity differs", () => {
    const h1 = createHash("sha256")
      .update(renderMsaText(sample), "utf8")
      .digest("hex");
    const h2 = createHash("sha256")
      .update(renderMsaText({ ...sample, legalEntityName: "Other LLC" }), "utf8")
      .digest("hex");
    expect(h1).not.toBe(h2);
  });

  it("always includes the recitals and engagement sections", () => {
    const headings = msaSections(sample)
      .map((s) => s.heading)
      .filter(Boolean);
    expect(headings).toContain("Recitals");
    expect(headings).toContain("1. Engagement and Scope of Services");
  });
});
