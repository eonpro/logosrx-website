import Image from "next/image";
import Link from "next/link";
import type { NewsArticle } from "@/content/news";
import CategoryPill from "./CategoryPill";
import { formatNewsDate } from "./format";

interface FeaturedArticleProps {
  article: NewsArticle;
}

export default function FeaturedArticle({ article }: FeaturedArticleProps) {
  return (
    <Link
      href={`/newsroom/${article.slug}`}
      className="group grid overflow-hidden rounded-[2rem] bg-[#f3f2ef] md:grid-cols-2 transition-transform duration-300 hover:-translate-y-0.5"
    >
      <div className="relative aspect-square md:aspect-auto md:min-h-[22rem] overflow-hidden bg-navy/5">
        {article.heroImage ? (
          <Image
            src={article.heroImage}
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-navy/15 to-magenta/15" />
        )}
      </div>
      <div className="flex flex-col justify-center gap-4 p-7 sm:p-10">
        <CategoryPill label={article.category} />
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-navy leading-[1.15] group-hover:text-magenta transition-colors">
          {article.title}
        </h1>
        <p className="text-base text-navy/60 leading-relaxed line-clamp-3">
          {article.excerpt}
        </p>
        <time className="text-sm text-navy/50" dateTime={article.date}>
          {formatNewsDate(article.date)}
        </time>
      </div>
    </Link>
  );
}
