import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleBody from "@/components/news/ArticleBody";
import CategoryPill from "@/components/news/CategoryPill";
import NewsHeader from "@/components/news/NewsHeader";
import ShareBar from "@/components/news/ShareBar";
import { formatNewsDate } from "@/components/news/format";
import JsonLd from "@/components/JsonLd";
import {
  getNewsArticleBySlug,
  newsArticles,
} from "@/content/news";
import { CONTACT } from "@/lib/constants";
import { graph, newsArticleSchema, newsAbsoluteUrl } from "@/lib/seo";
import { buildNewsMetadata } from "@/lib/seo/news-metadata";

export function generateStaticParams() {
  return newsArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getNewsArticleBySlug(slug);
  if (!article) return {};

  // www `/news-site/*` is noindex via next.config; news host uses public URLs.
  return buildNewsMetadata({
    title: article.title,
    description: article.excerpt,
    path: `/newsroom/${article.slug}`,
    type: "article",
    publishedTime: article.date,
    image: article.heroImage,
  });
}

export default async function NewsArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getNewsArticleBySlug(slug);
  if (!article) notFound();

  const publicPath = `/newsroom/${article.slug}`;
  const shareUrl = newsAbsoluteUrl(publicPath);
  const schema = graph(
    newsArticleSchema({
      headline: article.title,
      description: article.excerpt,
      path: publicPath,
      datePublished: article.date,
      section: article.category,
      image: article.heroImage,
      authorName: article.author,
    }),
  );

  return (
    <>
      <NewsHeader showSearch={false} />
      <JsonLd data={schema} />
      <article className="flex-1">
        <div className="mx-auto max-w-3xl px-5 sm:px-8 pt-10 sm:pt-14 pb-6">
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <CategoryPill label="Newsroom" />
            <CategoryPill label={article.category} />
            {article.group === "education" && (
              <CategoryPill label="Education" />
            )}
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-navy leading-[1.12] mb-5">
            {article.title}
          </h1>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-navy/55 mb-8">
            {article.author && (
              <span>
                Written by <span className="font-medium text-navy/75">{article.author}</span>
              </span>
            )}
            {article.author && <span aria-hidden>|</span>}
            <time dateTime={article.date}>{formatNewsDate(article.date)}</time>
          </div>

          <div className="mb-8">
            <ShareBar title={article.title} url={shareUrl} />
          </div>
        </div>

        {article.heroImage && (
          <div className="mx-auto max-w-4xl px-5 sm:px-8 mb-10">
            <div className="relative aspect-[16/9] overflow-hidden rounded-[1.75rem] bg-navy/5">
              <Image
                src={article.heroImage}
                alt={article.heroCaption ?? ""}
                fill
                priority
                sizes="(max-width: 896px) 100vw, 896px"
                className="object-cover"
              />
            </div>
            {article.heroCaption && (
              <p className="mt-3 text-sm text-navy/50 text-center sm:text-left">
                {article.heroCaption}
              </p>
            )}
          </div>
        )}

        <div className="mx-auto max-w-3xl px-5 sm:px-8 pb-16">
          <ArticleBody paragraphs={article.content} />

          <aside className="mt-14 rounded-[1.5rem] bg-[#f3f2ef] p-6 sm:p-8">
            <h2 className="text-lg font-bold text-navy mb-2">Press resources</h2>
            <p className="text-sm text-navy/60 leading-relaxed mb-4">
              For media inquiries, product information, or clinic partnership
              questions, contact the Logos RX team.
            </p>
            <a
              href={CONTACT.emailHref}
              className="text-sm font-semibold text-magenta hover:text-navy transition-colors"
            >
              {CONTACT.email}
            </a>
          </aside>

          <div className="mt-10">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-navy/65 hover:text-magenta transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path
                  d="M10 4L6 8l4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Back to Newsroom
            </Link>
          </div>
        </div>
      </article>
    </>
  );
}
