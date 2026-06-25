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
export const PARTNER_OG_ALT = "Logos RX Partner Program";
export const CATALOG_OG_ALT = "Logos RX — 2026 Catalog";

async function logoDataUrl(): Promise<string> {
  const logo = await readFile(
    join(process.cwd(), "public/images/logo-white.svg"),
  );
  return `data:image/svg+xml;base64,${logo.toString("base64")}`;
}

export async function renderBrandOg(): Promise<ImageResponse> {
  const logoSrc = await logoDataUrl();

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

/**
 * Partner-program Open Graph / Twitter card. Used for `/partners` and its
 * sub-routes so links shared in iMessage, Slack, etc. read as the partner
 * program rather than the generic brand card. Renders live text, so two Inter
 * weights are loaded from `public/fonts` (Satori needs an embedded font).
 */
export async function renderPartnerOg(): Promise<ImageResponse> {
  const [logoSrc, bold, regular] = await Promise.all([
    logoDataUrl(),
    readFile(join(process.cwd(), "public/fonts/Inter-Bold.ttf")),
    readFile(join(process.cwd(), "public/fonts/Inter-Regular.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          padding: "84px",
          background:
            "radial-gradient(1100px 700px at 80% -10%, #6E469B 0%, rgba(110,70,155,0) 55%), linear-gradient(135deg, #262262 0%, #1a1750 100%)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={360} height={115} alt="Logos RX" />

        <div
          style={{
            display: "flex",
            marginTop: "48px",
            fontFamily: "Inter",
            fontWeight: 700,
            fontSize: "26px",
            letterSpacing: "8px",
            color: "#E2637A",
          }}
        >
          PARTNER PROGRAM
        </div>

        <div
          style={{
            display: "flex",
            marginTop: "16px",
            fontFamily: "Inter",
            fontWeight: 700,
            fontSize: "76px",
            color: "#ffffff",
            lineHeight: 1.05,
          }}
        >
          Work with Logos RX
        </div>

        <div
          style={{
            display: "flex",
            marginTop: "20px",
            fontFamily: "Inter",
            fontWeight: 400,
            fontSize: "32px",
            color: "rgba(255,255,255,0.7)",
          }}
        >
          Marketing &amp; brand-support partnerships
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Inter", data: bold, weight: 700, style: "normal" },
        { name: "Inter", data: regular, weight: 400, style: "normal" },
      ],
    },
  );
}

/**
 * Catalog Open Graph / Twitter card. Used by the private `/download/catalog`
 * link so that when it's shared in iMessage, Slack, X, email, etc. the preview
 * reads as the 2026 catalog rather than the generic brand card. Renders live
 * text, so two Inter weights are embedded (Satori needs an embedded font).
 */
export async function renderCatalogOg(): Promise<ImageResponse> {
  const [logoSrc, bold, regular] = await Promise.all([
    logoDataUrl(),
    readFile(join(process.cwd(), "public/fonts/Inter-Bold.ttf")),
    readFile(join(process.cwd(), "public/fonts/Inter-Regular.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          padding: "84px",
          background:
            "radial-gradient(1100px 700px at 85% -10%, #6E469B 0%, rgba(110,70,155,0) 55%), linear-gradient(135deg, #262262 0%, #1a1750 100%)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={320} height={102} alt="Logos RX" />

        <div
          style={{
            display: "flex",
            marginTop: "52px",
            fontFamily: "Inter",
            fontWeight: 700,
            fontSize: "26px",
            letterSpacing: "8px",
            color: "#E2637A",
          }}
        >
          PROVIDER PRICING
        </div>

        <div
          style={{
            display: "flex",
            marginTop: "14px",
            fontFamily: "Inter",
            fontWeight: 700,
            fontSize: "104px",
            color: "#ffffff",
            lineHeight: 1.02,
          }}
        >
          2026 Catalog
        </div>

        <div
          style={{
            display: "flex",
            marginTop: "22px",
            fontFamily: "Inter",
            fontWeight: 400,
            fontSize: "32px",
            color: "rgba(255,255,255,0.72)",
          }}
        >
          Compounded medications — GLP-1, HRT, peptides &amp; longevity
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Inter", data: bold, weight: 700, style: "normal" },
        { name: "Inter", data: regular, weight: 400, style: "normal" },
      ],
    },
  );
}
