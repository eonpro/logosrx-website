import Image from "next/image";
import Link from "next/link";
import type { NewsArticle } from "@/content/news";
import CategoryPill from "./CategoryPill";
import { formatNewsDate } from "./format";

interface ArticleCardProps {
  article: NewsArticle;
}

export default function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Link
      href={`/newsroom/${article.slug}`}
      className="group flex flex-col overflow-hidden rounded-[1.75rem] bg-[#f3f2ef] transition-transform duration-300 hover:-translate-y-0.5"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-navy/5">
        {article.heroImage ? (
          <Image
            src={article.heroImage}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-navy/10 to-magenta/10">
            <span className="text-sm font-semibold text-navy/40">{article.category}</span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
        <CategoryPill label={article.category} />
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-navy leading-snug group-hover:text-magenta transition-colors">
          {article.title}
        </h2>
        <time className="mt-auto text-sm text-navy/50" dateTime={article.date}>
          {formatNewsDate(article.date)}
        </time>
      </div>
    </Link>
  );
}
