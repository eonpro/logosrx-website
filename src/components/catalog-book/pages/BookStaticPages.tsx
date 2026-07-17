import Image from "next/image";
import type { ComponentType } from "react";
import type { StaticPageId } from "@/data/catalog-book";
import { STATE_LICENSES } from "@/data/licenses";
import USLicenseMap from "@/components/USLicenseMap";
import { CONTACT, HOURS, SITE } from "@/lib/constants";

/**
 * The one-off (non-product) pages of the native catalog book: cover, intro
 * spreads, LifeFile, coming-soon teaser, and back matter. Copy is transcribed
 * from the 2026 print catalog (with source typos corrected); photographic
 * elements are the crops in `/public/images/catalog-book/`.
 */

/* ──────────────────────────── Shared bits ──────────────────────────── */

/**
 * A page reproduced 1:1 from the print catalog artwork. Used where the
 * designed spread can't be improved on in HTML (cover, welcome, shipping).
 * The artwork is letterboxed to always be fully visible; a blurred copy
 * fills the leftover stage so the bars never read as empty chrome.
 */
function ArtworkPage({
  src,
  alt,
  priority = false,
  flipOnClick = false,
}: {
  src: string;
  alt: string;
  priority?: boolean;
  /** Make the whole page a "next page" target (used by the cover). */
  flipOnClick?: boolean;
}) {
  return (
    <div
      {...(flipOnClick ? { "data-book-next": true } : {})}
      className={`relative min-h-full overflow-hidden ${flipOnClick ? "cursor-pointer" : ""}`}
    >
      <Image
        src={src}
        alt=""
        aria-hidden="true"
        width={2200}
        height={1700}
        sizes="100vw"
        className="absolute inset-0 h-full w-full scale-110 object-cover blur-2xl"
        priority={priority}
      />
      <Image
        src={src}
        alt={alt}
        width={2200}
        height={1700}
        sizes="(min-width: 1152px) 1152px, 100vw"
        className="absolute inset-0 h-full w-full object-contain"
        priority={priority}
      />
    </div>
  );
}

function PageShell({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`min-h-full px-6 py-10 sm:px-10 sm:py-12 lg:px-14 ${className}`}>
      {children}
    </div>
  );
}

/* ──────────────────────────── Pages ──────────────────────────── */

function CoverPage() {
  return (
    <ArtworkPage
      src="/images/catalog-book/page-cover.webp"
      alt="Logos RX Product Catalog 2026 — Compounding Excellence. Trusted by 5000+ providers. LegitScript and NABP certified. Click or use the arrows to browse."
      priority
      flipOnClick
    />
  );
}

function WelcomePage() {
  return (
    <ArtworkPage
      src="/images/catalog-book/page-welcome.webp"
      alt="Welcome to the new and improved Logos RX — the 503A compounding pharmacy storefront. www.logosrx.com | @logosrx"
    />
  );
}

function ExcellencePage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center bg-sky-light px-6 py-16 text-center">
      <Image
        src="/images/logo-white.svg"
        alt=""
        aria-hidden="true"
        width={200}
        height={60}
        className="h-16 w-auto opacity-95"
      />
      <h2 className="mt-10 text-4xl font-bold text-white sm:text-5xl">
        Compounding <em>Excellence</em>
        <span className="block text-3xl sm:text-4xl">since 2016</span>
      </h2>
      <p className="mt-5 text-base text-white/90">
        Personalized medications. Trusted quality. Measurable results.
      </p>
    </div>
  );
}

function FacilityPage() {
  return (
    <PageShell className="bg-white">
      <div className="grid min-h-full grid-cols-1 items-center gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div>
          <h2 className="text-3xl font-bold leading-tight sm:text-4xl">
            <span className="bg-gradient-to-r from-purple to-navy bg-clip-text text-transparent">
              State-of-the-Art Sterile &amp; Non-Sterile{" "}
              <em>Compounding Facility</em>
            </span>
          </h2>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-navy/75 sm:text-[15px]">
            <p>
              At Logos RX, precision and purity define everything we do. Our
              state-of-the-art compounding laboratories are equipped to produce
              both sterile and non-sterile formulations under the highest
              quality standards. Every preparation is crafted in controlled
              ISO-certified cleanroom environments, ensuring uncompromising
              safety, accuracy, and consistency.
            </p>
            <p>
              From injectable peptides and hormone therapies to customized oral
              and topical formulations, Logos RX integrates advanced
              technology, pharmaceutical-grade ingredients, and rigorous USP
              &lt;797&gt;, &lt;795&gt;, and &lt;800&gt; compliance to deliver
              excellence in every dose.
            </p>
            <p>
              Each compound is prepared by licensed pharmacists and trained
              technicians utilizing validated equipment, HEPA-filtered laminar
              airflow hoods, and aseptic technique protocols that exceed
              regulatory expectations. The result: pharmacy-grade precision
              that supports patient safety, provider trust, and consistent
              clinical outcomes—nationwide.
            </p>
          </div>
        </div>
        <div className="overflow-hidden rounded-[2rem] border border-beige">
          <Image
            src="/images/catalog-book/facility-cleanroom.webp"
            alt="A Logos RX technician compounding in the ISO-certified cleanroom"
            width={800}
            height={1210}
            className="h-full max-h-[560px] w-full object-cover"
          />
        </div>
      </div>
    </PageShell>
  );
}

const PRODUCT_AREAS = [
  { label: "Hormone Replacement", active: true },
  { label: "Weight Management", active: true, highlight: true },
  { label: "Sexual Wellness", active: true },
  { label: "Dermatology", active: true },
  { label: "Pain Management", active: false },
  { label: "Peptide Therapies", active: false },
  { label: "Men's Health", active: false },
] as const;

function OurProductsPage() {
  return (
    <PageShell className="bg-white">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <ul className="order-2 space-y-3 md:order-1">
          {PRODUCT_AREAS.map((area) => (
            <li
              key={area.label}
              className={`rounded-xl border px-5 py-3.5 text-center text-sm font-medium ${
                "highlight" in area && area.highlight
                  ? "border-sky bg-sky-light text-white"
                  : area.active
                    ? "border-sky/50 text-navy"
                    : "border-beige text-navy/35"
              }`}
            >
              {area.label}
              {!area.active && (
                <span className="ml-2 text-[10px] uppercase tracking-wider">
                  Coming soon
                </span>
              )}
            </li>
          ))}
        </ul>
        <div className="order-1 md:order-2 md:text-right">
          <h2 className="text-4xl font-bold text-navy sm:text-5xl">
            Our <em>Products</em>
          </h2>
          <div className="mt-5 space-y-4 text-sm leading-relaxed text-navy/75 sm:text-[15px]">
            <p>
              At Logos RX, we are committed to providing expertly compounded
              therapies tailored to each individual&rsquo;s health goals. From
              topical creams and capsules to injectables, nasal sprays, and
              more—our diverse range of delivery methods ensures comprehensive
              treatment options designed for real results.
            </p>
            <p>
              Our ingredients are sourced exclusively from FDA-audited
              suppliers and undergo rigorous testing for purity and potency.
              Every formulation meets our uncompromising standards for quality,
              safety, and performance—so you can have complete confidence in
              every dose delivered.
            </p>
          </div>
        </div>
      </div>
      <div className="mt-10">
        <Image
          src="/images/catalog-book/vial-lineup.webp"
          alt="Logos RX multi-dose vials: Sermorelin, Glutathione, Semaglutide, Tirzepatide, Testosterone Cypionate, and NAD+"
          width={2810}
          height={900}
          className="mx-auto h-auto w-full max-w-3xl object-contain"
        />
      </div>
    </PageShell>
  );
}

function Glp1OverviewPage() {
  return (
    <PageShell className="bg-white">
      <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
        <h2 className="text-5xl font-bold text-navy sm:text-6xl">GLP-1</h2>
        <div>
          <p className="text-base font-bold text-navy">
            Experience the Full Potential of GLP-1 Therapy
          </p>
          <p className="text-sm italic text-navy/70">
            Clinically proven support for Blood Sugar, Weight Control, and
            Heart Health
          </p>
        </div>
      </div>
      <p className="mt-4 inline-flex rounded-lg bg-sky-light/25 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-sky">
        Weight Management
      </p>
      <p className="mt-6 max-w-4xl text-sm leading-relaxed text-navy/80 sm:text-base">
        GLP-1 therapies mimic a natural hormone in the body to help regulate
        blood sugar, promote sustainable weight loss, support cardiovascular
        health, enhance beta-cell function, and reduce the risk of low blood
        sugar events.
      </p>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {[
          {
            src: "/images/products/semaglutide-glycine.webp",
            name: "Semaglutide plus Glycine",
            detail: "2.5mg/20mg/mL · Injectable",
          },
          {
            src: "/images/products/tirzepatide-glycine.webp",
            name: "Tirzepatide plus Glycine",
            detail: "10mg/20mg/mL · Injectable",
          },
        ].map((vial) => (
          <figure
            key={vial.name}
            className="rounded-2xl bg-gradient-to-b from-cream to-beige/60 p-6"
          >
            <figcaption className="text-sm font-bold text-navy">
              {vial.name}
              <span className="block text-xs font-normal text-navy/60">
                {vial.detail}
              </span>
            </figcaption>
            <Image
              src={vial.src}
              alt={`${vial.name} multi-dose vial`}
              width={480}
              height={480}
              className="mx-auto mt-4 h-56 w-auto object-contain"
            />
          </figure>
        ))}
      </div>
    </PageShell>
  );
}

const LIFEFILE_FEATURES = [
  ["Automated Prescription Management", "Secure electronic prescribing and validation for all compounded formulations."],
  ["Real-Time Order Tracking", "Providers and partners can view prescription progress, shipping updates, and refill status instantly."],
  ["Quality & Compliance Control", "Built-in safeguards and audit trails ensure strict adherence to USP <795>, <797>, and <800> standards."],
  ["Seamless Communication", "Integrated messaging and notifications improve collaboration between clinicians, pharmacists, and patients."],
  ["Data Security & HIPAA Compliance", "End-to-end encryption and verified access for total data protection."],
] as const;

function LifeFilePage() {
  return (
    <PageShell className="bg-white">
      <h2 className="text-3xl font-bold leading-tight text-navy sm:text-4xl">
        Technology-Driven <em>Pharmacy</em> Operations
      </h2>
      <p className="mt-2 text-sm text-navy/60">
        powered by <span className="font-bold text-sky">LifeFile</span> —
        patient-centric technology solutions
      </p>

      <div className="mt-6 max-w-4xl space-y-4 text-sm leading-relaxed text-navy/75 sm:text-[15px]">
        <p>
          At Logos Rx, innovation goes beyond the compounding bench. We&rsquo;ve
          partnered with LifeFile, a leading pharmacy management platform
          designed exclusively for modern compounding and specialty pharmacies.
          LifeFile connects every step of our workflow—from prescription intake
          to fulfillment—ensuring precision, compliance, and transparency for
          every order we process.
        </p>
        <p>
          Through LifeFile&rsquo;s advanced digital ecosystem, our pharmacists,
          providers, and fulfillment teams work seamlessly to manage
          prescriptions, track formulation details, and ensure real-time status
          updates. This technology enables faster turnaround times, enhanced
          patient safety, and accurate communication with partner clinics and
          prescribers nationwide.
        </p>
      </div>

      <h3 className="mt-8 text-sm font-bold uppercase tracking-wider text-navy">
        Key Features of Our LifeFile Integration
      </h3>
      <ul className="mt-4 max-w-4xl space-y-3">
        {LIFEFILE_FEATURES.map(([title, description]) => (
          <li key={title} className="flex gap-3 text-sm leading-relaxed">
            <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-magenta" />
            <p className="text-navy/75">
              <strong className="text-navy">{title}</strong> — {description}
            </p>
          </li>
        ))}
      </ul>

      <p className="mt-8 max-w-4xl text-sm leading-relaxed text-navy/75 sm:text-[15px]">
        At Logos Rx, LifeFile isn&rsquo;t just software—it&rsquo;s the digital
        backbone of our pharmacy network, allowing us to deliver consistent,
        compliant, and connected care across every state we serve.
      </p>
    </PageShell>
  );
}

const COMING_PEPTIDES = [
  "AOD-9604", "BPC-157", "LL-37", "CJC-1295", "Dihexa Acetate", "Epitalon",
  "KPV", "MOTS-c", "Selank", "Semax", "Thymosin Alpha-1", "TB-500",
] as const;

function PeptidesTeaserPage() {
  return (
    <div
      className="relative flex min-h-full items-center overflow-hidden"
      /* Stops sampled from the model photo's baked-in backdrop so the
         full-bleed portrait blends seamlessly into the page. */
      style={{
        background:
          "linear-gradient(to bottom, #7fa2b8 0%, #95b6cb 25%, #94b7cd 50%, #859fb4 75%, #9ea9b8 90%, #9ea9b8 100%)",
      }}
    >
      {/* Ghost peptide list filling the page height, as in the print layout */}
      <ul
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-6 flex select-none flex-col justify-between pb-20 pt-8 text-2xl font-semibold leading-none text-white/30 sm:left-10 sm:text-3xl lg:left-14 lg:text-4xl"
      >
        {COMING_PEPTIDES.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>

      {/* Full-height model portrait, flush right */}
      <Image
        src="/images/catalog-book/peptides-model.webp"
        alt="A woman holding a Logos RX peptide vial"
        width={1400}
        height={2410}
        className="absolute inset-y-0 right-0 hidden h-full w-auto object-contain object-right [mask-image:linear-gradient(to_right,transparent,black_18%)] sm:block"
      />

      <h2 className="relative px-6 pb-16 text-5xl font-bold leading-[1.08] text-white sm:px-10 sm:text-6xl lg:px-14 lg:text-7xl">
        Injectable
        <br />
        Peptide
        <br />
        Therapies
      </h2>

      <div className="absolute bottom-7 left-6 flex items-center gap-4 sm:left-10 lg:left-14">
        <Image
          src="/images/logo-white.svg"
          alt="Logos RX"
          width={180}
          height={57}
          className="h-8 w-auto sm:h-10"
        />
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white sm:text-sm">
          Coming July 2026
        </p>
      </div>
    </div>
  );
}

const WHITE_LABEL_HIGHLIGHTS = [
  ["Custom Label Design", "Incorporate your logo, color palette, and brand elements."],
  ["Branded Patient Inserts", "Add instructions, educational material, or promotional messaging tailored to your practice."],
  ["Clinic-Specific Packaging", "Choose from premium containers, foams, and mailers to match your brand aesthetic."],
  ["Nationwide Fulfillment", "Seamless integration with our pharmacy network for fast, compliant delivery to your patients."],
] as const;

function WhiteLabelPage() {
  return (
    <PageShell className="bg-white">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <div>
          <h2 className="text-3xl font-bold leading-tight text-navy sm:text-4xl">
            Exclusive White-Label Packaging &amp; Inserts
          </h2>
          <p className="mt-2 text-lg font-medium italic text-purple">
            Personalized. Professional. Practice-Ready.
          </p>
          <div className="mt-5 space-y-4 text-sm leading-relaxed text-navy/75 sm:text-[15px]">
            <p>
              At Logos Rx, we understand that presentation matters as much as
              performance. That&rsquo;s why we offer exclusive white-label
              packaging and custom printed inserts designed specifically for
              telehealth providers, clinics, and medical brands who want to
              deliver a premium, unified patient experience.
            </p>
            <p>
              Our design and fulfillment team works closely with each partner
              to create branded labels, instruction cards, and product
              literature that reflect your clinic&rsquo;s identity—without
              compromising compliance or regulatory standards. Whether
              you&rsquo;re shipping compounded formulations nationwide or
              distributing medications in-office, our white-label solutions
              help your brand stand out while maintaining pharmacy-grade
              precision.
            </p>
          </div>

          <h3 className="mt-7 text-sm font-bold uppercase tracking-wider text-navy">
            Program Highlights
          </h3>
          <ul className="mt-4 space-y-3">
            {WHITE_LABEL_HIGHLIGHTS.map(([title, description]) => (
              <li key={title} className="flex gap-3 text-sm leading-relaxed">
                <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-magenta" />
                <p className="text-navy/75">
                  <strong className="text-navy">{title}</strong> — {description}
                </p>
              </li>
            ))}
          </ul>
        </div>
        <div className="overflow-hidden rounded-[2rem] border border-beige">
          <Image
            src="/images/catalog-book/white-label-grid.webp"
            alt="Examples of white-label mailers and branded packaging"
            width={700}
            height={1270}
            className="h-full max-h-[620px] w-full object-cover"
          />
        </div>
      </div>
      <p className="mt-8 text-xs italic leading-relaxed text-navy/60">
        Disclosure: White-label packaging and printed inserts are available as
        an optional add-on service and incur an additional cost and about 45
        days to fulfill.
      </p>
    </PageShell>
  );
}

function ShippingPage() {
  return (
    <ArtworkPage
      src="/images/catalog-book/page-shipping.webp"
      alt="Shipping & Packaging Options — Precision-Packed. Professionally Delivered. 2-day shipping nationwide $15; standard overnight nationwide $25. Cold-chain shipments use Kangaroo thermal bags, styrofoam cooler boxes, and refrigerant gel packs; non-cold orders ship nationwide via FedEx and UPS with next-day and 2-day options and real-time tracking."
    />
  );
}

function StatesPage() {
  return (
    <PageShell className="bg-white">
      <div className="book-rise">
        <h2 className="text-3xl font-bold leading-tight text-navy sm:text-4xl">
          Logos Rx State Licenses
        </h2>
        <p className="mt-2 text-lg font-medium italic text-sky">
          Expanding Access. Elevating Care. Nationwide.
        </p>
        <div className="mt-5 max-w-4xl space-y-4 text-sm leading-relaxed text-navy/75 sm:text-[15px]">
          <p>
            At Logos Rx, we are proud to be a multi-state licensed 503A
            compounding pharmacy, committed to delivering trusted, compliant,
            and high-quality compounded medications across the United States.
            Each license reflects our dedication to safety, transparency, and
            regulatory excellence—allowing us to serve patients and providers
            in more states every year.
          </p>
          <p>
            Our pharmacy currently holds active licenses in{" "}
            <strong className="text-navy">
              {STATE_LICENSES.length} jurisdictions
            </strong>
            :
          </p>
        </div>
      </div>

      {/* Choropleth: licensed jurisdictions in navy (hover for license #). */}
      <div
        className="book-rise mx-auto mt-8 w-full max-w-2xl"
        style={{ animationDelay: "140ms" }}
      >
        <USLicenseMap />
        <div className="mt-3 flex items-center justify-center gap-5 text-xs text-navy/60">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-navy" /> Licensed
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#E2E1DD]" /> Coming
            soon
          </span>
        </div>
      </div>

      <ul
        className="book-rise mt-8 grid grid-cols-1 gap-x-10 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3"
        style={{ animationDelay: "260ms" }}
      >
        {STATE_LICENSES.map((license) => (
          <li
            key={license.code}
            className="flex items-baseline justify-between gap-4 border-b border-beige/60 py-1.5 text-sm transition-colors hover:bg-cream/60"
          >
            <span className="font-medium text-navy">{license.name}</span>
            <span className="tabular-nums text-navy/60">
              {license.licenseNumber}
            </span>
          </li>
        ))}
      </ul>

      <p className="mt-6 text-xs italic text-navy/60">
        Additional state licenses coming soon.
      </p>
    </PageShell>
  );
}

function VialFillPage() {
  return (
    <div className="min-h-full bg-navy-deep px-6 py-10 sm:px-10 sm:py-12 lg:px-14">
      <div className="grid grid-cols-1 items-center gap-10 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div>
          <h2 className="text-3xl font-bold leading-tight text-white sm:text-4xl">
            Clarifying Injectable Vial Fill Amounts
          </h2>
          <p className="mt-4 inline-flex rounded-lg bg-sky-light/25 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-sky-light">
            Learning
          </p>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-white/80 sm:text-base">
            The exact volume of medication (measured in mL) is listed on the
            vial&rsquo;s label. A small amount of extra liquid—called
            overfill—is intentionally included to ensure the full stated dose
            is available, even if minor loss occurs during preparation or
            administration.
          </p>
          <p className="mt-8 text-xs font-medium uppercase tracking-wider text-white/60">
            The product label indicates the total liquid volume contained in
            the vial.
          </p>
          <Image
            src="/images/catalog-book/vial-label-card.webp"
            alt="A Logos RX Semaglutide 2 mL multi-dose vial label"
            width={960}
            height={435}
            className="mt-4 h-auto w-full max-w-xl rounded-xl"
          />
        </div>
        <div className="hidden justify-center md:flex">
          <Image
            src="/images/catalog-book/fill-volume-vial.webp"
            alt="A multi-dose vial marked with 1–5 mL fill volumes"
            width={520}
            height={1075}
            className="h-auto max-h-[560px] w-auto object-contain"
          />
        </div>
      </div>
    </div>
  );
}

function BackCoverPage() {
  return (
    <PageShell className="flex flex-col justify-center bg-white">
      <Image
        src="/images/logo.svg"
        alt="Logos RX"
        width={220}
        height={66}
        className="h-14 w-auto"
      />
      <h2 className="mt-8 text-4xl font-bold leading-tight text-navy sm:text-5xl">
        Logos RX
        <br />
        Pharmacy
      </h2>
      <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-navy/80">
        admin@logosrx.com
        <br />
        logosrx.com
        <br />
        Tampa, FL
      </p>

      <div className="mt-10 grid max-w-2xl grid-cols-1 gap-8 sm:grid-cols-2">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-navy">
            Headquarters
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-navy/75">
            {CONTACT.address.street}
            <br />
            {CONTACT.address.city}, {CONTACT.address.state} {CONTACT.address.zip}
            <br />
            P: 813-886-2800
            <br />
            F: {CONTACT.fax}
            <br />
            {CONTACT.email}
          </p>
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-navy">
            Hours of Operation
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-navy/75">
            Retail: {HOURS.retail}
            <br />
            Online: {HOURS.online}
            <br />
            Chat support: {SITE.url.replace("https://", "")} {HOURS.chat}
          </p>
        </div>
      </div>
    </PageShell>
  );
}

/* ──────────────────────────── Registry ──────────────────────────── */

export const STATIC_PAGE_COMPONENTS: Record<StaticPageId, ComponentType> = {
  cover: CoverPage,
  welcome: WelcomePage,
  excellence: ExcellencePage,
  facility: FacilityPage,
  "our-products": OurProductsPage,
  "glp1-overview": Glp1OverviewPage,
  lifefile: LifeFilePage,
  "peptides-teaser": PeptidesTeaserPage,
  "white-label": WhiteLabelPage,
  shipping: ShippingPage,
  states: StatesPage,
  "vial-fill": VialFillPage,
  "back-cover": BackCoverPage,
};
