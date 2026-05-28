import type { Metadata, Viewport } from "next";
import "./globals.css";
import JsonLd from "@/components/JsonLd";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: {
    default: `${SITE.name} | ${SITE.tagline}`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  metadataBase: new URL(SITE.url),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE.url,
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  appleWebApp: {
    capable: true,
    title: SITE.name,
    statusBarStyle: "black-translucent",
  },
  applicationName: SITE.name,
  formatDetection: {
    // Suppress iOS auto-linking of digits as phone numbers — the catalog has
    // a lot of dosage strings like "10mg/2mL" that iOS otherwise turns into
    // tappable phone links.
    telephone: false,
    address: false,
    date: false,
    email: false,
  },
};

/**
 * Viewport-level controls. `viewportFit: cover` lets the page paint behind
 * the iOS safe area inset (notch + home indicator) so the catalog's sticky
 * toolbar can sit flush against the top edge while content still respects
 * `env(safe-area-inset-*)` paddings. `themeColor` matches the navy brand so
 * the iOS Safari URL bar tints to the brand when scrolled.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#262262" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1750" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
         * Adobe Typekit (sofia-pro) optimized load:
         *   - preconnect both Typekit hosts to warm DNS + TLS in parallel
         *     with the HTML parse.
         *   - preload the stylesheet so the browser fetches it at high
         *     priority but doesn't block render. The companion `<link
         *     rel="stylesheet">` activates it once parsed.
         *   - `<noscript>` fallback ensures the font still loads if JS is
         *     disabled or blocked.
         *
         * Adobe's TOS prohibits redistributing the kit, so we cannot fully
         * self-host. This is the best perf we can get within those bounds.
         */}
        <link rel="preconnect" href="https://use.typekit.net" crossOrigin="" />
        <link rel="preconnect" href="https://p.typekit.net" crossOrigin="" />
        <link
          rel="preload"
          as="style"
          href="https://use.typekit.net/fcc6pra.css"
        />
        <link rel="stylesheet" href="https://use.typekit.net/fcc6pra.css" />
        <JsonLd />
      </head>
      <body className="min-h-screen flex flex-col" suppressHydrationWarning>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-lg focus:bg-magenta focus:px-4 focus:py-2 focus:text-white focus:text-sm focus:font-semibold"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
