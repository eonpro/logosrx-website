import Link from "next/link";
import type { Pillar } from "@/data/knowledge";
import { CONTACT, SITE } from "@/lib/constants";
import Reveal from "@/components/Reveal";

/**
 * Renders a topical-authority pillar page: answer-first callout, key takeaways,
 * structured sections (with optional comparison tables), FAQ, and related links.
 * Clean semantic headings + tables = strong machine extraction for AI engines.
 * Schema/breadcrumbs are emitted by the route.
 */
export default function PillarArticle({ pillar }: { pillar: Pillar }) {
  return (
    <article className="bg-white">
      {/* Hero + answer-first */}
      <section className="bg-gradient-to-b from-cream via-white to-white pt-10 sm:pt-16 pb-12 sm:pb-16">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky mb-4">
            {pillar.eyebrow}
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-navy leading-[1.08]">
            {pillar.title}
          </h1>

          <div className="mt-6 rounded-2xl border border-sky/30 bg-sky/5 px-6 py-5">
            <p className="text-base sm:text-lg leading-relaxed text-navy/85">
              {pillar.answerFirst}
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-6 lg:px-8 pb-16 sm:pb-24">
        {/* Key takeaways */}
        {pillar.keyTakeaways.length > 0 && (
          <Reveal>
            <div className="rounded-2xl border border-beige bg-cream/40 p-6 sm:p-8 mb-12">
              <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-magenta mb-4">
                Key takeaways
              </h2>
              <ul className="space-y-2.5">
                {pillar.keyTakeaways.map((t) => (
                  <li key={t} className="flex items-start gap-3 text-sm text-navy/80">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-magenta shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        )}

        {/* Sections */}
        <div className="space-y-12">
          {pillar.sections.map((section) => (
            <Reveal key={section.heading}>
              <section>
                <h2 className="text-2xl font-bold text-navy mb-4">{section.heading}</h2>
                <div className="space-y-4">
                  {section.body.map((p, i) => (
                    <p key={i} className="text-base leading-[1.8] text-navy/70">
                      {p}
                    </p>
                  ))}
                </div>

                {section.bullets && (
                  <ul className="mt-4 space-y-2">
                    {section.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-3 text-base text-navy/70">
                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-sky shrink-0" />
                        {b}
                      </li>
                    ))}
                  </ul>
                )}

                {section.table && (
                  <div className="mt-6 overflow-x-auto rounded-2xl border border-beige">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-cream/60 text-left">
                          {section.table.columns.map((c) => (
                            <th
                              key={c}
                              className="px-4 py-3 font-bold text-navy border-b border-beige"
                            >
                              {c}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {section.table.rows.map((row, ri) => (
                          <tr key={ri} className="even:bg-cream/20">
                            {row.map((cell, ci) => (
                              <td
                                key={ci}
                                className={`px-4 py-3 align-top border-b border-beige/60 ${
                                  ci === 0 ? "font-semibold text-navy" : "text-navy/70"
                                }`}
                              >
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </Reveal>
          ))}
        </div>

        {/* FAQ */}
        {pillar.faqs.length > 0 && (
          <Reveal>
            <section className="mt-16">
              <h2 className="text-2xl font-bold text-navy mb-6">Frequently asked questions</h2>
              <div className="space-y-6">
                {pillar.faqs.map((f) => (
                  <div key={f.question} className="border-b border-beige pb-6">
                    <h3 className="text-base font-bold text-navy mb-2">{f.question}</h3>
                    <p className="text-sm leading-relaxed text-navy/70">{f.answer}</p>
                  </div>
                ))}
              </div>
            </section>
          </Reveal>
        )}

        {/* Related */}
        {pillar.related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-navy/60 mb-4">
              Related reading
            </h2>
            <div className="flex flex-wrap gap-3">
              {pillar.related.map((r) => (
                <Link
                  key={r.href}
                  href={r.href}
                  className="rounded-full border border-beige px-5 py-2.5 text-sm font-semibold text-navy hover:border-magenta hover:text-magenta transition-colors"
                >
                  {r.label}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="mt-16 rounded-2xl bg-cream p-8 sm:p-10 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-navy mb-3">
            Work with a 503A compounding pharmacy
          </h2>
          <p className="text-navy/65 mb-6 max-w-xl mx-auto text-sm">
            Logos RX compounds personalized medications in Tampa and ships nationwide
            within our licensed states. Providers can prescribe through our portal.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href={SITE.onboarding}
              className="inline-flex items-center gap-2 rounded-full bg-magenta px-6 py-3 text-sm font-semibold text-white hover:bg-magenta/90 transition-colors"
            >
              Prescribe as a provider
            </Link>
            <a
              href={CONTACT.phoneHref}
              className="inline-flex items-center gap-2 rounded-full border-2 border-navy/15 px-6 py-3 text-sm font-semibold text-navy hover:border-magenta hover:text-magenta transition-colors"
            >
              Call {CONTACT.phone}
            </a>
          </div>
        </section>

        {/* Last reviewed */}
        <p className="mt-10 text-xs text-navy/50">
          Educational content. Compounded medications are not FDA-approved and require
          a prescription. Last reviewed {new Date(pillar.lastReviewed).toLocaleDateString("en-US", { month: "long", year: "numeric" })}.
        </p>
      </div>
    </article>
  );
}
