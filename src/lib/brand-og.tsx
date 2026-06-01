import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Shared Open Graph / Twitter card renderer used by the root `opengraph-image`
 * and `twitter-image` routes. Renders the white Logos wordmark centered on the
 * brand navy so links shared in iMessage, Slack, X, etc. show Logos branding.
 *
 * The logo is the existing brand SVG, rasterized by `next/og` (resvg) — no font
 * is loaded because the artwork is all vector paths, not live text.
 */
export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_ALT = "Logos RX — Compounding Excellence, Personalized.";

export async function renderBrandOg(): Promise<ImageResponse> {
  const logo = await readFile(
    join(process.cwd(), "public/images/logo-white.svg"),
  );
  const logoSrc = `data:image/svg+xml;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #262262 0%, #1a1750 100%)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={760} height={242} alt="Logos RX" />
      </div>
    ),
    { ...OG_SIZE },
  );
}
