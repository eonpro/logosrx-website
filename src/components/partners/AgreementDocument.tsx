import { MSA_TITLE, MSA_VERSION, msaSections, type MsaFieldValues } from "@/lib/partners/msa";

/**
 * Renders the Marketing Services Agreement as a white "paper" surface. Shared
 * by the signing screen (dark background), the partner/admin executed views,
 * and the print view, so the document always looks identical wherever it's
 * shown. Pure/presentational — no client hooks, safe in server components.
 */
export default function AgreementDocument({
  values,
  className = "",
}: {
  values: MsaFieldValues;
  className?: string;
}) {
  const sections = msaSections(values);
  return (
    <article
      className={`rounded-2xl bg-white p-6 text-navy shadow-sm sm:p-10 ${className}`}
    >
      <header className="mb-6 border-b border-beige pb-4 text-center">
        <h2 className="text-lg font-bold tracking-tight text-navy sm:text-xl">
          {MSA_TITLE}
        </h2>
        <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-navy/40">
          Version {MSA_VERSION}
        </p>
      </header>

      <div className="space-y-5 text-[13px] leading-relaxed text-navy/80">
        {sections.map((section, i) => (
          <section key={i} className="space-y-2">
            {section.heading && (
              <h3 className="text-sm font-semibold text-navy">
                {section.heading}
              </h3>
            )}
            {section.paragraphs.map((p, j) => (
              <p key={j} className={/^\([a-z]\) /.test(p) ? "pl-5" : undefined}>
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>
    </article>
  );
}
