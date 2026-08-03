interface ArticleBodyProps {
  paragraphs: string[];
}

export default function ArticleBody({ paragraphs }: ArticleBodyProps) {
  return (
    <div className="space-y-5 text-base sm:text-lg leading-relaxed text-navy/80">
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}
