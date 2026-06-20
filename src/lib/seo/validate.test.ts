import { describe, expect, it } from "vitest";
import { validateDocuments, nodesOf } from "./validate";
import {
  graph,
  organizationSchema,
  webSiteSchema,
  localBusinessSchema,
  medicalWebPageSchema,
  faqPageSchema,
  breadcrumbSchema,
  ENTITY_IDS,
} from "./schema";

describe("nodesOf", () => {
  it("flattens a graph document", () => {
    const doc = graph(organizationSchema(), webSiteSchema());
    expect(nodesOf(doc)).toHaveLength(2);
  });

  it("wraps a bare node", () => {
    expect(nodesOf({ "@type": "Thing", name: "x" })).toHaveLength(1);
  });

  it("returns [] for non-objects", () => {
    expect(nodesOf(null)).toEqual([]);
    expect(nodesOf("nope")).toEqual([]);
  });
});

describe("validateDocuments — valid output passes", () => {
  it("accepts the real sitewide + page graph", () => {
    const sitewide = graph(
      organizationSchema(),
      webSiteSchema(),
      localBusinessSchema(),
    );
    const page = graph(
      medicalWebPageSchema({
        name: "Test",
        description: "desc",
        path: "/test",
      }),
      faqPageSchema([{ question: "Q?", answer: "A." }]),
    );
    const breadcrumbs = graph(
      breadcrumbSchema([
        { name: "Home", path: "/" },
        { name: "Test", path: "/test" },
      ]),
    );
    expect(validateDocuments([sitewide, page, breadcrumbs])).toEqual([]);
  });

  it("resolves @id references to the sitewide globals (defined in another doc)", () => {
    // A Service node references the pharmacy @id defined only in the layout graph.
    const page = graph({
      "@type": "Service",
      name: "Compounding service",
      provider: { "@id": ENTITY_IDS.pharmacy },
    });
    expect(validateDocuments([page])).toEqual([]);
  });
});

describe("validateDocuments — catches problems", () => {
  it("flags a wrong @context on a graph", () => {
    const bad = { "@context": "http://example.com", "@graph": [] };
    const problems = validateDocuments([bad]);
    expect(problems.some((p) => p.message.includes("@context"))).toBe(true);
  });

  it("flags missing required MedicalWebPage props", () => {
    const bad = graph({ "@type": "MedicalWebPage", name: "Only a name" });
    const problems = validateDocuments([bad]);
    expect(problems.some((p) => p.message.includes("description"))).toBe(true);
    expect(problems.some((p) => p.message.includes("publisher"))).toBe(true);
  });

  it("flags an empty FAQPage and a missing answer", () => {
    expect(
      validateDocuments([graph({ "@type": "FAQPage", mainEntity: [] })]).length,
    ).toBeGreaterThan(0);

    const missingAnswer = graph({
      "@type": "FAQPage",
      mainEntity: [{ "@type": "Question", name: "Q?" }],
    });
    expect(
      validateDocuments([missingAnswer]).some((p) =>
        p.message.includes("acceptedAnswer"),
      ),
    ).toBe(true);
  });

  it("flags non-sequential breadcrumb positions", () => {
    const bad = graph({
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://x/" },
        { "@type": "ListItem", position: 3, name: "Deep", item: "https://x/deep" },
      ],
    });
    expect(
      validateDocuments([bad]).some((p) => p.message.includes("sequential")),
    ).toBe(true);
  });

  it("flags a dangling @id reference", () => {
    const bad = graph({
      "@type": "Service",
      name: "x",
      provider: { "@id": "https://www.logosrx.com/#does-not-exist" },
    });
    expect(
      validateDocuments([bad]).some((p) => p.message.includes("Dangling")),
    ).toBe(true);
  });

  it("flags duplicate BreadcrumbList nodes on one page", () => {
    const b = graph(
      breadcrumbSchema([{ name: "Home", path: "/" }]),
    );
    const problems = validateDocuments([b, b]);
    expect(
      problems.some((p) => p.message.includes("BreadcrumbList")),
    ).toBe(true);
  });
});
