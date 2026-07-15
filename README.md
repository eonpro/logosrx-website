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

- **View online** opens the **native catalog book** at `/download/catalog/view`
  — real HTML pages (one full-screen page at a time with prev/next, arrow keys,
  swipe, a table of contents, and `#page-id` deep links) composed from
  `src/data/catalog-book.ts` (page manifest), `src/data/products.ts` (product
  content), and `src/data/learning.ts` (dosage charts). Suggested-retail
  prices are read live from the `catalog_products` table, so edits in
  `/admin/catalog` appear immediately.
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

To publish an updated catalog PDF, re-run `npm run catalog:upload` and update
`CATALOG_PDF_URL` (the existing token is reused).

### Online catalog book

The online version needs no uploads or extra env vars: it renders natively
from the codebase. To add, remove, or reorder pages, edit the page manifest in
`src/data/catalog-book.ts`; product pages pull their content from
`src/data/products.ts` and their suggested-retail pricing live from the
`catalog_products` table.
