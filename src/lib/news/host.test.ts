import { describe, expect, it } from "vitest";
import { isNewsHost, newsPublicPath, rewriteNewsPath } from "./host";

describe("isNewsHost", () => {
  it("accepts production and local news hosts", () => {
    expect(isNewsHost("news.logosrx.com")).toBe(true);
    expect(isNewsHost("news.localhost:3000")).toBe(true);
    expect(isNewsHost("NEWS.logosrx.com")).toBe(true);
  });

  it("rejects main site hosts", () => {
    expect(isNewsHost("www.logosrx.com")).toBe(false);
    expect(isNewsHost("localhost:3000")).toBe(false);
    expect(isNewsHost(null)).toBe(false);
  });
});

describe("rewriteNewsPath", () => {
  it("rewrites hub and newsroom paths", () => {
    expect(rewriteNewsPath("/")).toBe("/news-site");
    expect(rewriteNewsPath("/newsroom")).toBe("/news-site/newsroom");
    expect(rewriteNewsPath("/newsroom/foo")).toBe("/news-site/newsroom/foo");
  });

  it("leaves unrelated paths alone", () => {
    expect(rewriteNewsPath("/sitemap.xml")).toBeNull();
    expect(rewriteNewsPath("/about")).toBeNull();
    expect(rewriteNewsPath("/news-site")).toBeNull();
  });
});

describe("newsPublicPath", () => {
  it("strips the internal mount", () => {
    expect(newsPublicPath("/news-site")).toBe("/");
    expect(newsPublicPath("/news-site/newsroom/foo")).toBe("/newsroom/foo");
  });
});
