import { describe, expect, it } from "vitest";
import { NEWS_SITE, NEWS_SITE_URL } from "@/lib/constants";
import { buildNewsMetadata } from "./news-metadata";

describe("buildNewsMetadata", () => {
  it("emits canonicals on the news origin", () => {
    const m = buildNewsMetadata({ path: "/newsroom/example" });
    expect(m.alternates?.canonical).toBe(
      `${NEWS_SITE_URL}/newsroom/example`,
    );
  });

  it("uses the newsroom site name in OG titles", () => {
    const m = buildNewsMetadata({ title: "Hello", path: "/" });
    expect(m.openGraph?.title).toBe(`Hello | ${NEWS_SITE.name}`);
    expect(m.openGraph?.url).toBe(`${NEWS_SITE_URL}/`);
  });
});
