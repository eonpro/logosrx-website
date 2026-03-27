import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { articles, getArticleBySlug } from "@/data/articles";

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};
  return {
    title: article.title,
    description: article.excerpt,
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  return (
    <article className="bg-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-cream to-white py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <Link
            href="/support"
            className="inline-flex items-center gap-2 text-sm font-medium text-navy/50 hover:text-magenta transition-colors mb-8"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to Support
          </Link>

          <span className="inline-block rounded-full bg-magenta/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-magenta mb-4">
            {article.category}
          </span>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-navy leading-tight mb-4">
            {article.title}
          </h1>

          <div className="flex items-center gap-4 text-sm text-navy/40">
            <time>
              {new Date(article.date).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </time>
            <span className="w-1 h-1 rounded-full bg-navy/20" />
            <span>{article.content.length} min read</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-3xl px-6 lg:px-8 py-12 sm:py-16">
        <div className="space-y-6">
          {article.content.map((paragraph, i) => (
            <p key={i} className="text-base leading-relaxed text-navy/70">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 rounded-2xl bg-cream p-8 sm:p-10 text-center">
          <h3 className="text-xl sm:text-2xl font-bold text-navy mb-3">
            Questions about this topic?
          </h3>
          <p className="text-sm text-navy/60 mb-6 max-w-md mx-auto">
            Our pharmacists are available to consult with providers and answer
            questions about formulations, dosing, and patient care.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:support@logosrx.com"
              className="inline-flex items-center gap-2 rounded-full bg-magenta px-6 py-3 text-sm font-semibold text-white hover:bg-magenta-dark transition-colors"
            >
              Contact Our Team
            </a>
            <Link
              href="/support"
              className="inline-flex items-center gap-2 rounded-full border-2 border-navy/20 px-6 py-3 text-sm font-semibold text-navy hover:border-magenta hover:text-magenta transition-colors"
            >
              Browse More Articles
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
