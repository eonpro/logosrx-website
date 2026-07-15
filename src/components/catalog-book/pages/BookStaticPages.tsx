import Image from "next/image";
import type { ComponentType } from "react";
import type { StaticPageId } from "@/data/catalog-book";
import { CONTACT, HOURS, SITE } from "@/lib/constants";

/**
 * The one-off (non-product) pages of the native catalog book: cover, intro
 * spreads, LifeFile, coming-soon teaser, and back matter. Copy is transcribed
 * from the 2026 print catalog (with source typos corrected); photographic
 * elements are the crops in `/public/images/catalog-book/`.
 */

/* ──────────────────────────── Shared bits ──────────────────────────── */

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
    <div className="relative flex min-h-full flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-navy-deep via-navy to-navy-deep px-6 py-16 text-center">
      {/* Watermark, echoing the print cover's oversized vertical type */}
      <p
        aria-hidden="true"
        className="pointer-events-none absolute -left-6 top-1/2 -translate-y-1/2 select-none text-7xl font-bold leading-none text-white/[0.05] sm:text-8xl"
      >
        Compounding
        <br />
        Excellence
      </p>

      <Image
        src="/images/logo-white.svg"
        alt="Logos RX"
        width={280}
        height={84}
        className="h-16 w-auto sm:h-20"
        priority
      />
      <p className="mt-6 text-sm font-medium text-white/70">
        Trusted by 5000+ providers
      </p>
      <h2 className="mt-8 text-4xl font-bold text-white sm:text-5xl">
        Product Catalog 2026
      </h2>

      <div className="mt-12 flex items-center gap-6">
        <span className="text-xs uppercase tracking-wider text-white/50">
          Certifications:
        </span>
        <span className="rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-white">
          LegitScript Certified
        </span>
        <Image
          src="/images/certifications/nabp.svg"
          alt="NABP — National Association of Boards of Pharmacy"
          width={110}
          height={40}
          className="h-9 w-auto rounded-lg bg-white/90 p-1.5"
        />
      </div>
    </div>
  );
}

function WelcomePage() {
  return (
    <div className="flex min-h-full flex-col bg-navy-deep">
      <div className="px-6 pb-6 pt-10 text-center sm:px-10">
        <p className="text-lg text-white/80">Welcome to the</p>
        <h2 className="mt-1 text-4xl font-bold text-white sm:text-5xl">
          new and improved
        </h2>
      </div>
      <div className="relative mx-6 flex-1 overflow-hidden rounded-2xl sm:mx-10">
        {/* Storefront photo crop from the print catalog */}
        <Image
          src="/images/catalog-book/storefront.webp"
          alt="The Logos RX compounding pharmacy storefront"
          width={1400}
          height={860}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="flex flex-col items-center gap-2 px-6 py-8 text-center">
        <h3 className="text-2xl font-bold text-white">503A Compounding Pharmacy</h3>
        <p className="text-sm text-white/75">
          www.logosrx.com <span className="mx-2 text-magenta">|</span> @logosrx
        </p>
      </div>
      <div
        aria-hidden="true"
        className="h-2 w-full bg-gradient-to-r from-sky via-magenta to-purple"
      />
    </div>
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
          width={1400}
          height={410}
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
    <div className="relative min-h-full overflow-hidden bg-gradient-to-b from-sky to-sky-light">
      <div className="grid min-h-full grid-cols-1 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="relative flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-14">
          <ul
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 select-none space-y-1 overflow-hidden px-6 py-6 text-2xl font-semibold text-white/15 sm:px-10"
          >
            {COMING_PEPTIDES.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <h2 className="relative text-4xl font-bold leading-tight text-white sm:text-5xl">
            Injectable
            <br />
            Peptide
            <br />
            Therapies
          </h2>
          <p className="relative mt-6 inline-flex w-fit rounded-full bg-white/15 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white">
            Coming July 2026
          </p>
        </div>
        <div className="relative hidden items-end md:flex">
          <Image
            src="/images/catalog-book/peptides-model.webp"
            alt="A woman holding a Logos RX peptide vial"
            width={700}
            height={1200}
            className="h-full max-h-[640px] w-auto object-contain object-bottom"
          />
        </div>
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
    <PageShell className="bg-gradient-to-b from-white to-sky-light/15">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div className="flex flex-col">
          <div className="space-y-2">
            {[
              ["2-day shipping nationwide", "$15"],
              ["Standard overnight nationwide", "$25"],
            ].map(([label, price]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 rounded-xl border border-sky/25 bg-white px-4 py-3"
              >
                <span className="text-sm font-medium text-navy">{label}</span>
                <span className="text-base font-bold tabular-nums text-navy">
                  {price}
                </span>
              </div>
            ))}
          </div>
          <Image
            src="/images/catalog-book/cold-shipment-box.webp"
            alt="An insulated cold-chain shipping box with a thermal pouch"
            width={760}
            height={870}
            className="mt-8 h-auto w-full max-w-sm self-center object-contain"
          />
        </div>

        <div>
          <h2 className="text-3xl font-bold leading-tight text-navy sm:text-4xl">
            Shipping &amp; Packaging Options
          </h2>
          <p className="mt-2 text-lg font-medium italic text-sky">
            Precision-Packed. Professionally Delivered.
          </p>
          <div className="mt-5 space-y-4 text-sm leading-relaxed text-navy/75">
            <p>
              At Logos Rx, every prescription is prepared, packaged, and
              shipped with uncompromising attention to quality, temperature
              control, and timeliness. Our logistics process is designed to
              maintain medication integrity from our pharmacy to your
              patient&rsquo;s doorstep — anywhere we&rsquo;re licensed to
              serve.
            </p>
            <p>
              We offer a selection of premium shipping packages to meet your
              specific product and patient needs:
            </p>
          </div>

          <h3 className="mt-6 text-sm font-bold uppercase tracking-wider text-navy">
            Cold-Chain Shipments
          </h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-navy/75">
            <li>
              <strong className="text-navy">Kangaroo Thermal Bags</strong> —
              lightweight insulated pouches ideal for short-distance and
              same-day deliveries.
            </li>
            <li>
              <strong className="text-navy">Cooler Boxes (Styrofoam)</strong> —
              premium-grade insulated containers engineered for
              temperature-sensitive compounds and longer transit times.
            </li>
            <li>
              <strong className="text-navy">Refrigerant Gel Packs</strong> —
              calibrated to maintain controlled temperatures during shipment
              and prevent thermal fluctuation.
            </li>
          </ul>

          <h3 className="mt-6 text-sm font-bold uppercase tracking-wider text-navy">
            Non-Cold Shipments
          </h3>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-navy/75">
            <li>
              <strong className="text-navy">Nationwide delivery via FedEx and UPS</strong>{" "}
              (carrier selection based on destination for optimal speed and
              reliability).
            </li>
            <li>
              <strong className="text-navy">Next-Day and 2-Day service options</strong>{" "}
              available for all non-cold orders.
            </li>
            <li>
              <strong className="text-navy">Real-time tracking</strong> ensures
              visibility at every step, from fulfillment to delivery
              confirmation.
            </li>
          </ul>

          <p className="mt-6 text-sm leading-relaxed text-navy/75">
            Our fulfillment system automatically selects the most efficient
            shipping method based on product type, destination, and delivery
            window — guaranteeing compliance, speed, and cost-effectiveness for
            every order.
          </p>
          <p className="mt-4 text-xs italic leading-relaxed text-navy/60">
            Note: Shipping available nationwide to all states in which Logos Rx
            is licensed. Pricing varies depending on shipping options selected
            by the client/practice.
          </p>
        </div>
      </div>
    </PageShell>
  );
}

/** Active state licenses, verbatim from the print catalog's STATES page. */
const STATE_LICENSES: readonly [state: string, license: string][] = [
  ["Arizona", "YO10146"],
  ["Colorado", "OSP.008086"],
  ["Connecticut", "PCN0004487"],
  ["Delaware", "A9_0013209"],
  ["Florida", "PH35710"],
  ["Georgia", "PHNR001834"],
  ["Hawaii", "2234"],
  ["Idaho", "3671078"],
  ["Iowa", "6000"],
  ["Illinois", "54023301"],
  ["Maine", "MO40003870"],
  ["Minnesota", "267202"],
  ["Missouri", "2025027288"],
  ["Montana", "PHA-MOP-LIC-117305"],
  ["North Dakota", "PHAR2300"],
  ["New Hampshire", "NR2395"],
  ["Nevada", "PH04794"],
  ["New Jersey", "28R000272200"],
  ["New Mexico", "PH00005974"],
  ["New York", "41913"],
  ["Ohio", "242000118"],
  ["Pennsylvania", "NP002337"],
  ["Rhode Island", "PHN12761"],
  ["South Dakota", "4002592"],
  ["Utah", "1423657"],
  ["Vermont", "36.0135138"],
  ["Washington D.C.", "NRX250001489"],
  ["Washington State", "PHNR.FO70125403"],
  ["Wisconsin", "3599-43"],
  ["Wyoming", "NR52563"],
];

function StatesPage() {
  return (
    <PageShell className="bg-white">
      <h2 className="text-3xl font-bold leading-tight text-navy sm:text-4xl">
        Logos Rx State Licenses
      </h2>
      <p className="mt-2 text-lg font-medium italic text-sky">
        Expanding Access. Elevating Care. Nationwide.
      </p>
      <div className="mt-5 max-w-4xl space-y-4 text-sm leading-relaxed text-navy/75 sm:text-[15px]">
        <p>
          At Logos Rx, we are proud to be a multi-state licensed 503A
          compounding pharmacy, committed to delivering trusted, compliant, and
          high-quality compounded medications across the United States. Each
          license reflects our dedication to safety, transparency, and
          regulatory excellence—allowing us to serve patients and providers in
          more states every year.
        </p>
        <p>Our pharmacy currently holds active licenses in the following states:</p>
      </div>

      <ul className="mt-6 grid grid-cols-1 gap-x-10 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
        {STATE_LICENSES.map(([state, license]) => (
          <li
            key={state}
            className="flex items-baseline justify-between gap-4 border-b border-beige/60 py-1.5 text-sm"
          >
            <span className="font-medium text-navy">{state}</span>
            <span className="tabular-nums text-navy/60">{license}</span>
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
