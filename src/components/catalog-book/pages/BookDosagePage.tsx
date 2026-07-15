import type { LearningArticle } from "@/data/learning";
import DosageChart from "@/components/learning/DosageChart";

interface BookDosagePageProps {
  article: LearningArticle;
}

/**
 * Dosage-explainer page of the catalog book — the mg ↔ mL ↔ insulin-units
 * conversion chart that accompanies each GLP-1 product page, reusing the
 * `/learn/[slug]` chart renderer.
 */
export default function BookDosagePage({ article }: BookDosagePageProps) {
  return (
    <div className="min-h-full bg-white px-6 py-10 sm:px-10 sm:py-12 lg:px-14">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div>
          <p className="inline-flex rounded-lg bg-sky-light/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-sky">
            {article.eyebrow}
          </p>
          <h2 className="mt-4 text-3xl font-bold leading-tight text-navy sm:text-4xl">
            {article.drug}
            <span className="mt-1 block text-xl font-medium italic text-navy/60 sm:text-2xl">
              Dosage
            </span>
          </h2>
          <div className="mt-5 space-y-4">
            {article.paragraphs.map((paragraph) => (
              <p
                key={paragraph.slice(0, 40)}
                className="text-sm leading-relaxed text-navy/75 sm:text-[15px]"
              >
                {paragraph}
              </p>
            ))}
          </div>
          <p className="mt-6 rounded-xl border border-beige bg-cream/70 px-4 py-3 text-xs leading-relaxed text-navy/70">
            {article.referenceEquivalence}
          </p>
        </div>

        <div className="rounded-2xl border border-beige bg-cream/40 p-5 sm:p-8">
          <DosageChart rows={article.chartRows} />
        </div>
      </div>
    </div>
  );
}
