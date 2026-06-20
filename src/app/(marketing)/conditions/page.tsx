import type { Metadata } from "next";
import Link from "next/link";
import { conditions } from "@/data/conditions";
import {
  buildMetadata,
  graph,
  medicalWebPageSchema,
} from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import MedicalDisclaimer from "@/components/MedicalDisclaimer";

export const metadata: Metadata = buildMetadata({
  title: "Conditions & Compounding",
  description:
    "How compounding lets providers personalize prescriptions across menopause, low testosterone, weight management, hormone imbalance, and skin health. Educational; not medical advice.",
  path: "/conditions",
});

export default function ConditionsHub() {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Conditions", path: "/conditions" },
  ];

  const schema = graph(
    medicalWebPageSchema({
      name: "Conditions & Compounding",
      description:
        "Educational overview of how compounding supports provider-directed care across common areas. Compounded preparations are not FDA-approved.",
      path: "/conditions",
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
              Conditions
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-navy leading-[1.05]">
              Conditions &amp; compounding
            </h1>
            <div className="mt-6 rounded-2xl border border-sky/30 bg-sky/5 px-6 py-5">
              <p className="text-base sm:text-lg leading-relaxed text-navy/85">
                Providers across many areas use compounding to personalize a
                prescription — a custom strength, an alternative dosage form, or a
                combination that isn&rsquo;t available commercially. The pages below explain,
                in plain language, how that works. They are educational only: Logos RX
                does not diagnose or recommend treatment, and compounded preparations are
                not FDA-approved.
              </p>
            </div>
            <div className="mt-6">
              <MedicalDisclaimer />
            </div>
          </div>
        </section>

        <section className="bg-white pb-16 sm:pb-24">
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {conditions.map((c) => (
                <Link
                  key={c.slug}
                  href={`/conditions/${c.slug}`}
                  className="group rounded-2xl border border-beige/70 bg-cream/40 p-6 hover:border-magenta/40 hover:shadow-sm transition-all"
                >
                  <h2 className="text-lg font-bold text-navy group-hover:text-magenta transition-colors">
                    {c.name}
                  </h2>
                  <p className="mt-2 text-sm text-navy/65 line-clamp-3">
                    {c.metaDescription}
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
          </div>
        </section>
      </div>
    </>
  );
}
