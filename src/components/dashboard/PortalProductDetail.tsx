import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/data/products";
import type { StorefrontProduct } from "@/lib/portal/storefront";
import { discountPercent, formatCents } from "@/lib/portal/pricing";
import { Badge, btnAccent, btnSecondary } from "@/components/ui/portal";
import ProductIngredients from "@/components/product/ProductIngredients";
import ProductHowToTake from "@/components/product/ProductHowToTake";
import ProductDetailsTable from "@/components/product/ProductDetailsTable";
import ProductDosageSchedule from "@/components/product/ProductDosageSchedule";
import ProductFAQ from "@/components/product/ProductFAQ";
import ProductBadge from "@/components/product/ProductBadge";

interface PortalProductDetailProps {
  sku: StorefrontProduct;
  marketing: Product | null;
}

/**
 * In-portal product page: clinic price + volume pricing CTA, plus the same
 * educational sections as the public catalog when a marketing product maps.
 * Prescribe CTAs are intentionally omitted.
 */
export default function PortalProductDetail({
  sku,
  marketing,
}: PortalProductDetailProps) {
  const off = discountPercent(sku.standardCents, sku.priceCents);
  const showStrike =
    sku.standardCents !== null &&
    sku.priceCents !== null &&
    sku.priceCents < sku.standardCents;
  const meta = [sku.strength, sku.form, sku.unit ?? "Each"]
    .filter(Boolean)
    .join(" · ");
  const requestHref = `/dashboard/pricing-request?product=${encodeURIComponent(sku.id)}`;
  const image = marketing?.image;
  const imageAlt = marketing?.imageAlt ?? sku.name;

  return (
    <article>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Link
          href="/dashboard"
          className="text-sm font-semibold text-navy/50 transition-colors hover:text-navy"
        >
          ← Back to catalog
        </Link>

        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="flex items-center justify-center rounded-3xl border border-beige/70 bg-white p-8 shadow-soft">
            {image ? (
              <Image
                src={image}
                alt={imageAlt}
                width={420}
                height={420}
                className="h-auto max-h-80 w-auto object-contain"
                priority
              />
            ) : (
              <div
                className="flex h-64 w-28 flex-col items-center rounded-2xl bg-gradient-to-b from-magenta/80 via-purple-deep/70 to-navy-deep/90 shadow-soft-lg"
                aria-hidden="true"
              >
                <div className="mt-0 h-6 w-10 rounded-t-lg bg-magenta-light/80" />
                <div className="mt-2 flex flex-1 items-center justify-center px-2 text-center text-[10px] font-bold uppercase tracking-wider text-white/80">
                  {sku.name}
                </div>
              </div>
            )}
          </div>

          <div>
            {marketing?.categoryKey && (
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-navy/45">
                {marketing.categoryKey}
              </p>
            )}
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-navy sm:text-4xl">
              {marketing?.name ?? sku.name}
              {marketing?.modifier && (
                <span className="mt-1 block text-lg font-medium italic text-navy/65">
                  {marketing.modifier}
                </span>
              )}
            </h1>

            {marketing?.badges && marketing.badges.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {marketing.badges.map((b) => (
                  <ProductBadge key={b.label} badge={b} />
                ))}
              </div>
            )}

            {meta && (
              <p className="mt-3 text-sm font-medium text-navy/55">{meta}</p>
            )}

            {(marketing?.tagline || sku.details) && (
              <p className="mt-4 text-[15px] leading-relaxed text-navy/65">
                {marketing?.tagline ?? sku.details}
              </p>
            )}

            {marketing?.heroBullets && marketing.heroBullets.length > 0 && (
              <ul className="mt-5 space-y-2">
                {marketing.heroBullets.map((bullet) => (
                  <li
                    key={bullet}
                    className="flex gap-2 text-sm leading-relaxed text-navy/70"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-plum" />
                    {bullet}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-8 rounded-3xl border border-beige/80 bg-white p-5 shadow-soft">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/40">
                Your clinic price
              </p>
              <div className="mt-2 flex flex-wrap items-end gap-2">
                <span className="text-3xl font-bold tabular-nums text-navy">
                  {formatCents(sku.priceCents)}
                </span>
                {sku.priceCents !== null && (
                  <span className="pb-1 text-sm text-navy/45">
                    / {(sku.unit ?? "each").toLowerCase()}
                  </span>
                )}
              </div>
              {(showStrike || off > 0) && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {showStrike && (
                    <span className="text-sm text-navy/40 line-through tabular-nums">
                      {formatCents(sku.standardCents)}
                    </span>
                  )}
                  {off > 0 && (
                    <Badge tone="success">
                      {sku.isOverride ? "Your price" : `${off}% off`}
                    </Badge>
                  )}
                </div>
              )}

              <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                <Link href={requestHref} className={btnAccent}>
                  Request custom pricing based on volume
                </Link>
                <Link href="/dashboard" className={btnSecondary}>
                  Browse catalog
                </Link>
              </div>
            </div>

            {sku.therapeuticAreas.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {sku.therapeuticAreas.map((area) => (
                  <Badge key={area} tone="neutral">
                    {area}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        {!marketing && sku.details && (
          <section className="mt-12 rounded-3xl border border-beige/70 bg-white p-6 shadow-soft sm:p-8">
            <h2 className="text-xl font-bold text-navy">Product details</h2>
            <p className="mt-3 text-sm leading-relaxed text-navy/65">
              {sku.details}
            </p>
            <dl className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {sku.strength && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-navy/40">
                    Strength
                  </dt>
                  <dd className="mt-1 text-sm text-navy">{sku.strength}</dd>
                </div>
              )}
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wider text-navy/40">
                  Form
                </dt>
                <dd className="mt-1 text-sm text-navy">{sku.form}</dd>
              </div>
              {sku.unit && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-navy/40">
                    Unit
                  </dt>
                  <dd className="mt-1 text-sm text-navy">{sku.unit}</dd>
                </div>
              )}
            </dl>
          </section>
        )}
      </div>

      {marketing && (
        <>
          <ProductIngredients product={marketing} />
          <ProductHowToTake product={marketing} />
          <ProductDetailsTable product={marketing} />
          <ProductDosageSchedule product={marketing} />
          <ProductFAQ product={marketing} />
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
            <div className="rounded-3xl bg-plum px-6 py-8 text-center text-white shadow-soft-lg sm:px-10">
              <h2 className="font-display text-2xl font-medium sm:text-3xl">
                Ordering more? Ask for volume pricing
              </h2>
              <p className="mx-auto mt-2 max-w-lg text-sm text-white/70">
                Share your expected monthly volume and we&rsquo;ll send your
                practice a better rate.
              </p>
              <Link
                href={requestHref}
                className="mt-5 inline-flex rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-plum transition-all hover:bg-cream active:scale-[0.98]"
              >
                Request custom pricing based on volume
              </Link>
            </div>
          </div>
        </>
      )}
    </article>
  );
}
