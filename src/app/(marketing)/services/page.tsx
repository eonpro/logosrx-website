import type { Metadata } from "next";
import Link from "next/link";
import { services } from "@/data/services";
import { SITE } from "@/lib/constants";
import {
  buildMetadata,
  graph,
  medicalWebPageSchema,
} from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";

export const metadata: Metadata = buildMetadata({
  title: "Compounding Services",
  description:
    "Logos RX compounds personalized medications across hormone therapy, weight management, peptide therapy, longevity, and dermatology — by prescription, in Tampa, shipped nationwide.",
  path: "/services",
});

export default function ServicesHub() {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Services", path: "/services" },
  ];

  const schema = graph(
    medicalWebPageSchema({
      name: "Compounding Services",
      description:
        "Personalized compounding services from Logos RX across hormone therapy, weight management, peptide therapy, longevity, and dermatology.",
      path: "/services",
    }),
  );

  return (
    <>
      <JsonLd data={schema} />
      <Breadcrumbs items={crumbs} />

      <div className="bg-white">
        <section className="bg-gradient-to-b from-cream via-white to-white pt-10 sm:pt-16 pb-12 sm:pb-16">
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky mb-4">
              Services
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-navy leading-[1.05]">
              Compounding services
            </h1>
            <div className="mt-6 rounded-2xl border border-sky/30 bg-sky/5 px-6 py-5">
              <p className="text-base sm:text-lg leading-relaxed text-navy/85">
                Logos RX is a 503A compounding pharmacy in Tampa, Florida that prepares
                personalized medications to a provider&rsquo;s prescription across several
                therapeutic areas. Every preparation is made per patient under USP
                standards and shipped within our licensed states.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white pb-16 sm:pb-24">
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {services.map((s) => (
                <Link
                  key={s.slug}
                  href={`/services/${s.slug}`}
                  className="group rounded-2xl border border-beige/70 bg-cream/40 p-6 hover:border-magenta/40 hover:shadow-sm transition-all"
                >
                  <h2 className="text-lg font-bold text-navy group-hover:text-magenta transition-colors">
                    {s.name}
                  </h2>
                  <p className="mt-2 text-sm text-navy/65 line-clamp-3">
                    {s.metaDescription}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-magenta uppercase tracking-wider">
                    Learn more
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </Link>
              ))}
            </div>

            <div className="mt-12 rounded-2xl bg-cream p-8 sm:p-10 text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-navy mb-3">
                Need a custom formulation?
              </h2>
              <p className="text-navy/65 mb-6 text-sm max-w-xl mx-auto">
                If you&rsquo;re a provider, you can prescribe through our portal. If you&rsquo;re
                a patient, we can help connect you with a prescriber.
              </p>
              <Link
                href={SITE.onboarding}
                className="inline-flex items-center gap-2 rounded-full bg-magenta px-7 py-3.5 text-sm font-semibold text-white hover:bg-magenta/90 transition-colors"
              >
                Get started
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
