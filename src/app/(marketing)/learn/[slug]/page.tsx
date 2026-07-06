import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLearningArticle, learningArticles } from "@/data/learning";
import { getProductBySlug } from "@/data/products";
import { CONTACT } from "@/lib/constants";
import {
  buildMetadata,
  graph,
  articleSchema,
  medicalWebPageSchema,
} from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import DosageChart from "@/components/learning/DosageChart";
import Reveal from "@/components/Reveal";

export function generateStaticParams() {
  return learningArticles.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getLearningArticle(slug);
  if (!article) return {};
  return buildMetadata({
    title: article.title,
    description: article.subtitle,
    path: `/learn/${article.slug}`,
    type: "article",
  });
}

export default async function LearningArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getLearningArticle(slug);
  if (!article) notFound();

  const relatedProduct = getProductBySlug(article.relatedProductSlug);

  const path = `/learn/${article.slug}`;
  const schema = graph(
    medicalWebPageSchema({
      name: article.title,
      description: article.subtitle,
      path,
    }),
    articleSchema({
      headline: article.title,
      description: article.subtitle,
      path,
      section: "Patient Education",
    }),
  );

  return (
    <article className="bg-white">
      <JsonLd data={schema} />
      <Breadcrumbs
        items={[
          { name: "Home", path: "/" },
          { name: "Support Center", path: "/support" },
          { name: article.title, path },
        ]}
      />
      {/* Hero */}
      <section className="bg-gradient-to-b from-cream via-white to-white pt-12 sm:pt-20 pb-12 sm:pb-16">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <Link
            href={relatedProduct ? `/products/${relatedProduct.slug}` : "/catalog"}
            className="inline-flex items-center gap-2 text-sm font-medium text-navy/65 hover:text-magenta transition-colors mb-8"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {relatedProduct ? `Back to ${relatedProduct.name}` : "Back to Catalog"}
          </Link>

          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky mb-4">
            {article.eyebrow}
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-navy leading-[1.05]">
            {article.title}
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-navy/70 italic">
            {article.subtitle}
          </p>
          <p className="mt-3 text-sm text-navy/60">
            Concentration shown: <span className="font-semibold text-navy">{article.concentrationLabel}</span>
          </p>
        </div>
      </section>

      {/* Chart + copy */}
      <section className="bg-white pb-16 sm:pb-24">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            <div className="lg:col-span-7 space-y-5">
              {article.paragraphs.map((p, i) => (
                <Reveal key={i} delay={i * 50}>
                  <p className="text-base leading-[1.8] text-navy/70">{p}</p>
                </Reveal>
              ))}

              <Reveal delay={article.paragraphs.length * 50}>
                <div className="mt-4 rounded-2xl border border-magenta/30 bg-magenta/5 px-6 py-5">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-magenta mb-2">
                    Reference equivalence
                  </p>
                  <p className="text-sm leading-relaxed text-navy/80">
                    {article.referenceEquivalence}
                  </p>
                </div>
              </Reveal>

              {relatedProduct ? (
                <Reveal>
                  <Link
                    href={`/products/${relatedProduct.slug}`}
                    className="mt-8 inline-flex items-center gap-2 rounded-full border-2 border-magenta px-6 py-3 text-sm font-semibold text-magenta hover:bg-magenta hover:text-white transition-colors"
                  >
                    {article.ctaLabel}
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <path d="M4 10l6-6M5 4h5v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </Reveal>
              ) : null}
            </div>

            <div className="lg:col-span-5">
              <Reveal>
                <div className="rounded-3xl bg-cream/70 border border-beige/70 p-6 sm:p-8">
                  <DosageChart rows={article.chartRows} />
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="bg-white pb-20 sm:pb-28">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="border-t border-beige pt-8">
            <p className="text-xs text-navy/60 leading-relaxed max-w-3xl">
              <strong className="text-navy/80">Disclaimer:</strong> This explainer is
              provided for educational purposes only and does not constitute medical
              advice. Always follow the specific dosing instructions provided by your
              healthcare provider and the medication label. If you have questions about
              your prescribed therapy, contact your provider or Logos RX at{" "}
              <a href={CONTACT.phoneHref} className="text-magenta hover:underline">
                {CONTACT.phone}
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </article>
  );
}
