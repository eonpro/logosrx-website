import type { Metadata } from "next";
import Link from "next/link";
import { cityLocations } from "@/data/locations";
import { stateSlug } from "@/data/states";
import { STATES_SERVED, STATE_NAMES, SITE } from "@/lib/constants";
import {
  buildMetadata,
  graph,
  medicalWebPageSchema,
} from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";

export const metadata: Metadata = buildMetadata({
  title: "Locations & Service Areas",
  description:
    "Logos RX is a compounding pharmacy in Tampa, Florida serving the Tampa Bay metro and shipping personalized medications to multiple U.S. states. Find your area.",
  path: "/locations",
});

const flCities = cityLocations.filter((c) => c.state === "FL");

export default function LocationsHub() {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Locations", path: "/locations" },
  ];

  const schema = graph(
    medicalWebPageSchema({
      name: "Locations & Service Areas",
      description:
        "Logos RX compounding pharmacy locations and service areas, headquartered in Tampa, Florida and licensed across multiple U.S. states.",
      path: "/locations",
    }),
  );

  return (
    <>
      <JsonLd data={schema} />
      <Breadcrumbs items={crumbs} />

      <div className="bg-white">
        {/* Hero */}
        <section className="bg-gradient-to-b from-cream via-white to-white pt-10 sm:pt-16 pb-12 sm:pb-16">
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky mb-4">
              Locations &amp; Service Areas
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-navy leading-[1.05]">
              Where Logos RX serves
            </h1>
            <div className="mt-6 rounded-2xl border border-sky/30 bg-sky/5 px-6 py-5">
              <p className="text-base sm:text-lg leading-relaxed text-navy/85">
                Logos RX is a 503A compounding pharmacy headquartered in Tampa,
                Florida. We serve the entire Tampa Bay metro from our local sterile
                and non-sterile labs, and ship personalized, prescription-only
                compounded medications to multiple U.S. states
                nationwide.
              </p>
            </div>
          </div>
        </section>

        {/* Florida cities */}
        <section className="bg-white pb-14 sm:pb-20">
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-2">
              Tampa Bay, Florida
            </h2>
            <p className="text-navy/65 mb-8">
              Local service areas around our Tampa headquarters.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {flCities.map((c) => (
                <Link
                  key={c.slug}
                  href={`/locations/fl/${c.slug}`}
                  className="group rounded-2xl border border-beige/70 bg-cream/40 p-5 hover:border-magenta/40 hover:shadow-sm transition-all"
                >
                  <h3 className="text-base font-bold text-navy group-hover:text-magenta transition-colors">
                    {c.city}, {c.state}
                    {c.isFlagship && (
                      <span className="ml-2 rounded-full bg-magenta/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-magenta align-middle">
                        HQ
                      </span>
                    )}
                  </h3>
                  <p className="mt-1.5 text-sm text-navy/60 line-clamp-2">
                    {c.metaDescription}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* States served */}
        <section className="bg-cream/40 py-14 sm:py-20 border-y border-beige/60">
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-2">
              States we ship to
            </h2>
            <p className="text-navy/65 mb-8 max-w-2xl">
              Logos RX is licensed to compound and ship to providers and patients in
              the U.S. states listed below. Contact us to confirm
              availability for a specific medication in your state.
            </p>
            <ul className="flex flex-wrap gap-2">
              {STATES_SERVED.map((code) => (
                <li key={code}>
                  <Link
                    href={`/locations/${stateSlug(code)}`}
                    className="inline-block rounded-full bg-white border border-beige px-4 py-2 text-sm font-medium text-navy/75 hover:border-magenta hover:text-magenta transition-colors"
                  >
                    {STATE_NAMES[code] ?? code}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-white py-14 sm:py-20">
          <div className="mx-auto max-w-3xl px-6 lg:px-8 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-4">
              Don&rsquo;t see your area?
            </h2>
            <p className="text-navy/65 mb-8">
              We ship nationwide within our licensed states. Reach out and our team
              will confirm availability for your location and prescription.
            </p>
            <Link
              href={SITE.onboarding}
              className="inline-flex items-center gap-2 rounded-full bg-magenta px-7 py-3.5 text-sm font-semibold text-white hover:bg-magenta/90 transition-colors"
            >
              Get started
            </Link>
          </div>
        </section>
      </div>
    </>
  );
}
