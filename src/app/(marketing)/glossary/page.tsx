import type { Metadata } from "next";
import Link from "next/link";
import { glossaryTerms } from "@/data/knowledge";
import {
  buildMetadata,
  graph,
  medicalWebPageSchema,
  definedTermSetSchema,
} from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";

export const metadata: Metadata = buildMetadata({
  title: "Compounding Pharmacy Glossary",
  description:
    "Plain-language definitions of compounding pharmacy terms — 503A, 503B, sterile and non-sterile compounding, USP <795>/<797>/<800>, BHRT, titration, and more.",
  path: "/glossary",
});

export default function GlossaryIndex() {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Glossary", path: "/glossary" },
  ];

  const schema = graph(
    medicalWebPageSchema({
      name: "Compounding Pharmacy Glossary",
      description:
        "Definitions of compounding pharmacy terms and concepts from Logos RX.",
      path: "/glossary",
    }),
    definedTermSetSchema({
      name: "Compounding Pharmacy Glossary",
      path: "/glossary",
      terms: glossaryTerms.map((t) => ({
        term: t.term,
        definition: t.definition,
        path: `/glossary/${t.slug}`,
      })),
    }),
  );

  return (
    <>
      <JsonLd data={schema} />
      <Breadcrumbs items={crumbs} />

      <div className="bg-white">
        <section className="bg-gradient-to-b from-cream via-white to-white pt-10 sm:pt-16 pb-12">
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky mb-4">
              Reference
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold text-navy leading-[1.08]">
              Compounding pharmacy glossary
            </h1>
            <p className="mt-5 text-lg text-navy/70 leading-relaxed">
              Plain-language definitions of the terms providers and patients run into
              when working with a compounding pharmacy.
            </p>
          </div>
        </section>

        <section className="bg-white pb-20 sm:pb-28">
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            <dl className="divide-y divide-beige">
              {glossaryTerms.map((t) => (
                <div key={t.slug} className="py-6">
                  <dt>
                    <Link
                      href={`/glossary/${t.slug}`}
                      className="text-lg font-bold text-navy hover:text-magenta transition-colors"
                    >
                      {t.term}
                    </Link>
                    {t.abbr && t.abbr !== t.term && (
                      <span className="ml-2 text-sm text-navy/50">({t.abbr})</span>
                    )}
                  </dt>
                  <dd className="mt-2 text-base leading-relaxed text-navy/70">
                    {t.definition}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </div>
    </>
  );
}
