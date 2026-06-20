import { describe, expect, it } from "vitest";
import { buildMetadata } from "./metadata";
import { SITE } from "@/lib/constants";

describe("buildMetadata", () => {
  it("emits a self-referencing canonical from the path", () => {
    const m = buildMetadata({ path: "/locations/fl/tampa" });
    expect(m.alternates?.canonical).toBe(`${SITE.url}/locations/fl/tampa`);
  });

  it("defaults canonical to the site root", () => {
    expect(buildMetadata().alternates?.canonical).toBe(`${SITE.url}/`);
  });

  it("mirrors title/description into OG and Twitter cards", () => {
    const m = buildMetadata({ title: "Tampa", description: "d", path: "/t" });
    expect(m.openGraph?.title).toBe(`Tampa | ${SITE.name}`);
    expect(m.openGraph?.url).toBe(`${SITE.url}/t`);
    expect(m.twitter && "title" in m.twitter ? m.twitter.title : undefined).toBe(
      `Tampa | ${SITE.name}`,
    );
  });

  it("sets noindex robots only when requested", () => {
    expect(buildMetadata()).not.toHaveProperty("robots");
    expect(buildMetadata({ noindex: true }).robots).toMatchObject({
      index: false,
    });
  });

  it("resolves social images to absolute URLs", () => {
    const m = buildMetadata({ image: "/images/facility-tampa.png", path: "/" });
    const images = m.openGraph?.images as Array<{ url: string }>;
    expect(images[0].url).toBe(`${SITE.url}/images/facility-tampa.png`);
  });
});
