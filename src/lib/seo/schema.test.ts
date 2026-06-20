import { describe, expect, it } from "vitest";
import {
  ENTITY_IDS,
  absoluteUrl,
  organizationSchema,
  webSiteSchema,
  localBusinessSchema,
  breadcrumbSchema,
  faqPageSchema,
  medicalWebPageSchema,
  articleSchema,
  graph,
} from "./schema";
import { SITE, SAME_AS } from "@/lib/constants";

describe("absoluteUrl", () => {
  it("composes site-relative paths against SITE.url", () => {
    expect(absoluteUrl("/locations/fl/tampa")).toBe(
      `${SITE.url}/locations/fl/tampa`,
    );
  });
  it("passes through absolute URLs untouched", () => {
    expect(absoluteUrl("https://example.com/x")).toBe("https://example.com/x");
  });
  it("defaults to the site root", () => {
    expect(absoluteUrl()).toBe(`${SITE.url}/`);
  });
});

describe("organizationSchema", () => {
  const org = organizationSchema();
  it("uses the stable organization @id", () => {
    expect(org["@id"]).toBe(ENTITY_IDS.organization);
  });
  it("omits sameAs when no verified profiles are configured", () => {
    if (SAME_AS.length === 0) {
      expect(org).not.toHaveProperty("sameAs");
    } else {
      expect(org.sameAs).toEqual([...SAME_AS]);
    }
  });
  it("never emits a fabricated aggregateRating", () => {
    expect(org).not.toHaveProperty("aggregateRating");
  });
});

describe("webSiteSchema", () => {
  it("references the organization as publisher and exposes SearchAction", () => {
    const site = webSiteSchema();
    expect(site.publisher).toEqual({ "@id": ENTITY_IDS.organization });
    expect((site.potentialAction as Record<string, unknown>)["@type"]).toBe(
      "SearchAction",
    );
  });
});

describe("localBusinessSchema", () => {
  it("is a Pharmacy + LocalBusiness with geo coordinates", () => {
    const biz = localBusinessSchema();
    expect(biz["@type"]).toContain("Pharmacy");
    expect(biz["@type"]).toContain("LocalBusiness");
    expect(biz.geo).toMatchObject({ "@type": "GeoCoordinates" });
  });
  it("lists served states as areaServed entities", () => {
    const biz = localBusinessSchema();
    const area = biz.areaServed as Array<Record<string, unknown>>;
    expect(area.length).toBeGreaterThan(20);
    expect(area.every((a) => a["@type"] === "State")).toBe(true);
  });
  it("only includes aggregateRating when real data is supplied", () => {
    expect(localBusinessSchema()).not.toHaveProperty("aggregateRating");
    const rated = localBusinessSchema({
      aggregateRating: { ratingValue: 4.9, reviewCount: 120 },
    });
    expect(rated.aggregateRating).toMatchObject({ ratingValue: 4.9 });
  });
});

describe("breadcrumbSchema", () => {
  it("numbers positions from 1 with absolute item URLs", () => {
    const bc = breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Locations", path: "/locations" },
    ]);
    const items = bc.itemListElement as Array<Record<string, unknown>>;
    expect(items[0].position).toBe(1);
    expect(items[1].item).toBe(`${SITE.url}/locations`);
  });
});

describe("faqPageSchema", () => {
  it("maps Q/A pairs to Question/Answer nodes", () => {
    const faq = faqPageSchema([{ question: "Q?", answer: "A." }]);
    const main = faq.mainEntity as Array<Record<string, unknown>>;
    expect(main[0]["@type"]).toBe("Question");
    expect((main[0].acceptedAnswer as Record<string, unknown>).text).toBe("A.");
  });
});

describe("medicalWebPageSchema", () => {
  it("adds reviewedBy only when a reviewer is provided", () => {
    expect(
      medicalWebPageSchema({ name: "X", description: "d", path: "/x" }),
    ).not.toHaveProperty("reviewedBy");
    const reviewed = medicalWebPageSchema({
      name: "X",
      description: "d",
      path: "/x",
      reviewer: { name: "Jane Doe", credential: "PharmD" },
    });
    expect(reviewed.reviewedBy).toMatchObject({ name: "Jane Doe" });
  });
});

describe("articleSchema", () => {
  it("falls back dateModified to datePublished", () => {
    const a = articleSchema({
      headline: "H",
      description: "d",
      path: "/learn/x",
      datePublished: "2026-01-01",
    });
    expect(a.dateModified).toBe("2026-01-01");
  });
});

describe("graph", () => {
  it("wraps nodes in a single @context @graph document", () => {
    const g = graph(organizationSchema(), webSiteSchema());
    expect(g["@context"]).toBe("https://schema.org");
    expect((g["@graph"] as unknown[]).length).toBe(2);
  });
});
