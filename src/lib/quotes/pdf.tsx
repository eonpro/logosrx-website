import "server-only";
import path from "node:path";
import { readFile } from "node:fs/promises";
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import sharp from "sharp";
import type { PricingQuote, PricingQuoteItem } from "@/lib/db/schema";
import type { CatalogLookups } from "@/lib/quotes/lookups";
import { formatCents, discountPercent } from "@/lib/portal/pricing";
import { CONTACT, SITE } from "@/lib/constants";

/**
 * Branded, graphic PDF of a pricing quote — the downloadable artifact a clinic
 * can keep/share after reviewing their quote link. Rendered server-side with
 * `@react-pdf/renderer`; brand SVG/WebP assets are rasterized to PNG with
 * `sharp` because react-pdf's <Image> only accepts PNG/JPEG.
 */

// Brand palette (mirrors --color-* tokens in globals.css).
const NAVY = "#262262";
const MAGENTA = "#C62E88";
const CREAM = "#F5F4F1";
const BEIGE = "#E8E6E1";
const INK_SOFT = "#6B6890"; // navy at ~60%

const PUBLIC_DIR = path.join(process.cwd(), "public");

/** Rasterizes a /public asset (svg/webp/png/…) to a PNG buffer for react-pdf. */
async function loadPublicImageAsPng(
  publicPath: string,
  width: number,
): Promise<Buffer | null> {
  try {
    // Only serve files that actually live under /public (paths come from our
    // own catalog data, but keep the invariant explicit).
    const abs = path.join(PUBLIC_DIR, path.normalize(publicPath).replace(/^\/+/, ""));
    if (!abs.startsWith(PUBLIC_DIR)) return null;
    const raw = await readFile(abs);
    return await sharp(raw, { density: 300 })
      .resize({ width, withoutEnlargement: false })
      .png()
      .toBuffer();
  } catch {
    return null;
  }
}

let cachedLogo: Buffer | null = null;
async function loadLogo(): Promise<Buffer | null> {
  if (cachedLogo) return cachedLogo;
  cachedLogo = await loadPublicImageAsPng("/images/logo.svg", 480);
  return cachedLogo;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 56,
    paddingHorizontal: 44,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: NAVY,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 18,
  },
  logo: { width: 120 },
  headerRight: { alignItems: "flex-end" },
  kicker: {
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: INK_SOFT,
  },
  quoteTitle: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    marginTop: 2,
  },
  meta: { fontSize: 9, color: INK_SOFT, marginTop: 2 },
  rule: { height: 3, backgroundColor: MAGENTA, borderRadius: 2, marginBottom: 18 },
  introCard: {
    backgroundColor: CREAM,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  clinicName: { fontSize: 14, fontFamily: "Helvetica-Bold" },
  introText: { marginTop: 6, lineHeight: 1.5, color: INK_SOFT },
  discountPill: {
    alignSelf: "flex-start",
    marginTop: 8,
    backgroundColor: MAGENTA,
    color: "#FFFFFF",
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  thead: {
    flexDirection: "row",
    backgroundColor: NAVY,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  th: {
    color: "#FFFFFF",
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: BEIGE,
  },
  rowAlt: { backgroundColor: CREAM },
  colProduct: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  colStandard: { width: 90, textAlign: "right" },
  colPrice: { width: 100, textAlign: "right" },
  thumbBox: {
    width: 34,
    height: 34,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: BEIGE,
    backgroundColor: CREAM,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  thumb: { width: 30, height: 30, objectFit: "contain" },
  productName: { fontFamily: "Helvetica-Bold", fontSize: 10 },
  productUnit: { fontSize: 8, color: INK_SOFT, marginTop: 1 },
  standard: {
    color: INK_SOFT,
    textDecoration: "line-through",
    fontSize: 9,
  },
  price: { fontFamily: "Helvetica-Bold", fontSize: 10 },
  save: { fontSize: 7.5, color: MAGENTA, fontFamily: "Helvetica-Bold", marginTop: 1 },
  validity: { marginTop: 14, fontSize: 9, color: INK_SOFT },
  footer: {
    position: "absolute",
    left: 44,
    right: 44,
    bottom: 24,
    borderTopWidth: 1,
    borderTopColor: BEIGE,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 7.5, color: INK_SOFT },
});

export interface QuotePdfItem {
  id: number;
  name: string;
  unit: string | null;
  priceCents: number;
  standardCents: number | null;
  /** Pre-rasterized PNG thumbnail, or null for the placeholder box. */
  png: Buffer | null;
}

function QuotePdf({
  quote,
  items,
  logo,
}: {
  quote: PricingQuote;
  items: QuotePdfItem[];
  logo: Buffer | null;
}) {
  const issued = (quote.createdAt ?? new Date()).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const expiry = quote.expiresAt
    ? quote.expiresAt.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;
  const greeting = quote.intro?.trim()
    ? quote.intro.trim()
    : "Here is the custom pricing we've prepared for your practice.";

  return (
    <Document
      title={`${SITE.name} Pricing Quote — ${quote.clinicName?.trim() || quote.email}`}
      author={SITE.name}
    >
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header} fixed>
          {logo ? (
            /* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt prop */
            <Image style={styles.logo} src={{ data: logo, format: "png" }} />
          ) : (
            <Text style={styles.quoteTitle}>{SITE.name}</Text>
          )}
          <View style={styles.headerRight}>
            <Text style={styles.kicker}>Custom pricing quote</Text>
            <Text style={styles.quoteTitle}>Pricing Quote</Text>
            <Text style={styles.meta}>Issued {issued}</Text>
          </View>
        </View>
        <View style={styles.rule} />

        <View style={styles.introCard}>
          <Text style={styles.kicker}>Prepared for</Text>
          <Text style={[styles.clinicName, { marginTop: 3 }]}>
            {quote.clinicName?.trim() || "Your clinic"}
          </Text>
          {quote.contactName?.trim() ? (
            <Text style={styles.meta}>Attn: {quote.contactName.trim()}</Text>
          ) : null}
          <Text style={styles.introText}>{greeting}</Text>
          {quote.discountPct > 0 && (
            <Text style={styles.discountPill}>
              {quote.discountPct}% OFF STANDARD PRICING ACROSS THE CATALOG
            </Text>
          )}
        </View>

        {items.length > 0 && (
          <View>
            <View style={styles.thead} fixed>
              <Text style={[styles.th, styles.colProduct]}>Product</Text>
              <Text style={[styles.th, styles.colStandard]}>Standard</Text>
              <Text style={[styles.th, styles.colPrice]}>Your price</Text>
            </View>
            {items.map((it, i) => {
              const save = discountPercent(it.standardCents, it.priceCents);
              return (
                <View
                  key={it.id}
                  style={i % 2 === 1 ? [styles.row, styles.rowAlt] : styles.row}
                  wrap={false}
                >
                  <View style={styles.colProduct}>
                    <View style={styles.thumbBox}>
                      {it.png ? (
                        /* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt prop */
                        <Image
                          style={styles.thumb}
                          src={{ data: it.png, format: "png" }}
                        />
                      ) : null}
                    </View>
                    <View>
                      <Text style={styles.productName}>{it.name}</Text>
                      {it.unit ? (
                        <Text style={styles.productUnit}>{it.unit}</Text>
                      ) : null}
                    </View>
                  </View>
                  <View style={styles.colStandard}>
                    {it.standardCents !== null ? (
                      <Text style={styles.standard}>
                        {formatCents(it.standardCents)}
                      </Text>
                    ) : (
                      <Text style={{ color: INK_SOFT }}>—</Text>
                    )}
                  </View>
                  <View style={styles.colPrice}>
                    <Text style={styles.price}>{formatCents(it.priceCents)}</Text>
                    {save > 0 && <Text style={styles.save}>SAVE {save}%</Text>}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <Text style={styles.validity}>
          {expiry
            ? `This quote is valid through ${expiry}.`
            : "Pricing is subject to change — please confirm with your Logos RX representative."}{" "}
          Accept your quote online to create your provider account with this
          pricing applied.
        </Text>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>
            {SITE.legalName} · {CONTACT.address.full}
          </Text>
          <Text style={styles.footerText}>
            {CONTACT.phone} · {CONTACT.email}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

/** Renders the branded quote PDF and returns it as a Buffer. */
export async function renderQuotePdf(
  quote: PricingQuote,
  items: PricingQuoteItem[],
  lookups: CatalogLookups,
): Promise<Buffer> {
  const logo = await loadLogo();

  const pdfItems: QuotePdfItem[] = await Promise.all(
    items.map(async (it) => {
      const image = it.productId ? lookups.imageById.get(it.productId) ?? null : null;
      const png = image ? await loadPublicImageAsPng(image.url, 120) : null;
      return {
        id: it.id,
        name: it.productName,
        unit: it.unit,
        priceCents: it.priceCents,
        standardCents: it.productId
          ? lookups.standardCentsById.get(it.productId) ?? null
          : null,
        png,
      };
    }),
  );

  return renderToBuffer(
    <QuotePdf quote={quote} items={pdfItems} logo={logo} />,
  );
}
