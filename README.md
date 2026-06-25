# Logos RX — Compounding Excellence, Personalized

Custom-built website for Logos RX, a multi-state licensed 503A compounding pharmacy. Built with Next.js 15, TypeScript, and Tailwind CSS.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS 4
- **Animations**: Framer Motion
- **Fonts**: DM Serif Display (headings) + Inter (body) via `next/font`
- **Deployment**: Vercel

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              Root layout (fonts, metadata, header/footer)
│   ├── page.tsx                Homepage
│   ├── not-found.tsx           404 page
│   ├── robots.ts               robots.txt generation
│   ├── sitemap.ts              sitemap.xml generation
│   ├── globals.css             Design tokens and global styles
│   └── products/[slug]/
│       └── page.tsx            Dynamic product pages (SSG)
├── components/
│   ├── Header.tsx              Fixed header with logo and hamburger
│   ├── MobileMenu.tsx          Slide-out navigation drawer
│   ├── Hero.tsx                Homepage hero section
│   ├── BuildingTrust.tsx       Dark overlay mission section
│   ├── FeaturedProducts.tsx    Product grid section
│   ├── ProductCard.tsx         Reusable product card
│   ├── DrivenByExcellence.tsx  Split layout quality section
│   ├── Testimonial.tsx         Provider testimonial section
│   ├── ScrollingMarquee.tsx    Infinite scroll text banner
│   ├── PatientRefill.tsx       Patient refill CTA section
│   ├── Footer.tsx              4-column footer
│   ├── ProductDetail.tsx       Product page layout
│   ├── CollapsibleSection.tsx  Animated accordion
│   └── JsonLd.tsx              SEO structured data
├── data/
│   └── products.ts             Product catalog (hardcoded)
└── lib/
    └── constants.ts            Site config, contact info, nav links
```

## Routes

| Route | Description |
|-------|-------------|
| `/` | Homepage with all sections |
| `/products/glutathione` | Glutathione product page |
| `/products/nad` | NAD+ product page |
| `/products/sermorelin` | Sermorelin product page |
| `/robots.txt` | SEO robots file |
| `/sitemap.xml` | SEO sitemap |

## Adding Real Assets

Replace placeholder images in `public/images/`:

- `logo.svg` / `logo-white.svg` — Brand logo
- `products/glutathione.png` — Glutathione vial photo
- `products/nad.png` — NAD+ vial photo
- `products/sermorelin.png` — Sermorelin vial photo
- `certifications/legitscript.png` — LegitScript badge
- `certifications/nabp.png` — NABP seal

## Deployment

This project is configured for Vercel. Connect the Git repository and deploy with zero configuration.

```bash
npm run build    # Verify production build locally
```

## Adding New Products

Edit `src/data/products.ts` to add new compounds. Each product needs:
- `name`, `slug`, `description`
- `activeIngredient` with name and description
- `details` array (How to Use, Size, Concentration, Schedule, BUD)
- Product image in `public/images/products/`

## Private Catalog Download Link

The 2026 catalog PDF (~34 MB) is **not** committed to the repo or linked from
any public page. It lives in Vercel Blob and is reachable only through an
unlisted, token-gated link you share by hand:

```
https://www.logosrx.com/download/catalog?key=<CATALOG_DOWNLOAD_TOKEN>
```

Opening that link shows a branded **landing page** (`page.tsx`) with the catalog
cover, a summary of what's inside, and two buttons — **View online** and
**Download PDF** — rather than force-downloading the 34 MB file on arrival.

- **View online** opens a page-flip **flipbook** at `/download/catalog/view`
  (`Flipbook.tsx`, built on the MIT `page-flip` library) — one full landscape
  page at a time with a realistic page-curl. It reads the optimized WebP page
  images from a `manifest.json` in Blob (`CATALOG_FLIPBOOK_URL`).
- **Download PDF** points at the token-gated streaming route
  (`/download/catalog/file`), which streams the file through itself, so the
  underlying blob URL is never exposed and the browser gets a clean
  `Logos-RX-Catalog-2026.pdf` filename.

A wrong/absent key returns a generic 404 on every route. Rotating
`CATALOG_DOWNLOAD_TOKEN` instantly revokes every link you've handed out.

### One-time setup

1. Ensure `BLOB_READ_WRITE_TOKEN` is in `.env.local` (Vercel → Storage → Blob,
   or `vercel env pull .env.local`).
2. Upload the PDF and print the env values:

   ```bash
   npm run catalog:upload -- "/path/to/Logos RX Catalog 2026.pdf"
   ```

3. Add the two printed values to your hosting env (and `.env.local` for local
   testing):

   | Var | Purpose |
   |-----|---------|
   | `CATALOG_PDF_URL` | Vercel Blob URL of the uploaded PDF (server-only). |
   | `CATALOG_DOWNLOAD_TOKEN` | High-entropy secret required as `?key=`. Rotate to revoke. |
   | `CATALOG_COVER_URL` | _(optional)_ Cover image shown on the landing page. Falls back to a styled placeholder when unset. |
   | `CATALOG_FLIPBOOK_URL` | _(optional)_ URL of the flipbook `manifest.json`. When set, a "View online" button appears. |

To publish an updated catalog, re-run `npm run catalog:upload` and update
`CATALOG_PDF_URL` (the existing token is reused).

### Online flipbook

Build the flipbook page images (optimizes the numbered catalog page JPGs to
WebP, uploads them, and prints `CATALOG_FLIPBOOK_URL`):

```bash
npm run catalog:flipbook -- "/path/to/LOGOS RX CATALOG 2026"
```

Then set the printed `CATALOG_FLIPBOOK_URL` in your hosting env. Re-run and
update the var whenever the catalog pages change.
