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
