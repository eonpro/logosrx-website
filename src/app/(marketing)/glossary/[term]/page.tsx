import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { glossaryTerms, getGlossaryTerm } from "@/data/knowledge";
import {
  buildMetadata,
  graph,
  definedTermSchema,
} from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";

interface PageProps {
  params: Promise<{ term: string }>;
}

export function generateStaticParams() {
  return glossaryTerms.map((t) => ({ term: t.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { term } = await params;
  const entry = getGlossaryTerm(term);
  if (!entry) return {};
  return buildMetadata({
    title: `${entry.term} — Definition`,
    description: entry.definition,
    path: `/glossary/${entry.slug}`,
  });
}

export default async function GlossaryTermPage({ params }: PageProps) {
  const { term } = await params;
  const entry = getGlossaryTerm(term);
  if (!entry) notFound();

  const path = `/glossary/${entry.slug}`;
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Glossary", path: "/glossary" },
    { name: entry.term, path },
  ];

  const schema = graph(
    definedTermSchema({
      term: entry.term,
      definition: entry.definition,
      path,
      setName: "Compounding Pharmacy Glossary",
    }),
  );

  return (
    <>
      <JsonLd data={schema} />
      <Breadcrumbs items={crumbs} />

      <article className="bg-white">
        <section className="bg-gradient-to-b from-cream via-white to-white pt-10 sm:pt-16 pb-12">
          <div className="mx-auto max-w-2xl px-6 lg:px-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky mb-4">
              Glossary
            </p>
            <h1 className="text-4xl sm:text-5xl font-bold text-navy leading-[1.08]">
              {entry.term}
            </h1>
            <div className="mt-6 rounded-2xl border border-sky/30 bg-sky/5 px-6 py-5">
              <p className="text-base sm:text-lg leading-relaxed text-navy/85">
                {entry.definition}
              </p>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-2xl px-6 lg:px-8 pb-20 sm:pb-28">
          {entry.details && entry.details.length > 0 && (
            <div className="space-y-4">
              {entry.details.map((p, i) => (
                <p key={i} className="text-base leading-[1.8] text-navy/70">
                  {p}
                </p>
              ))}
            </div>
          )}

          {entry.related && entry.related.length > 0 && (
            <div className="mt-10">
              <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-navy/60 mb-4">
                Related
              </h2>
              <div className="flex flex-wrap gap-3">
                {entry.related.map((r) => (
                  <Link
                    key={r.href}
                    href={r.href}
                    className="rounded-full border border-beige px-5 py-2.5 text-sm font-semibold text-navy hover:border-magenta hover:text-magenta transition-colors"
                  >
                    {r.label}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-12 pt-8 border-t border-beige">
            <Link
              href="/glossary"
              className="inline-flex items-center gap-2 text-sm font-semibold text-navy/70 hover:text-magenta transition-colors"
            >
              ← All glossary terms
            </Link>
          </div>
        </div>
      </article>
    </>
  );
}
