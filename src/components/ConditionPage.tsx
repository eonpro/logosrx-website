import Link from "next/link";
import type { Condition } from "@/data/conditions";
import { getService } from "@/data/services";
import { CONTACT, SITE } from "@/lib/constants";
import Reveal from "@/components/Reveal";
import TrackedLink from "@/components/TrackedLink";
import MedicalDisclaimer from "@/components/MedicalDisclaimer";

/**
 * Renders a single condition page. Deliberately leads with the compliant
 * answer-first block + disclaimer, then neutral "about", then capability-framed
 * personalization/options, then a CTA to the mapped service. Schema/breadcrumbs
 * are emitted by the route.
 */
export default function ConditionPage({ condition }: { condition: Condition }) {
  const service = getService(condition.serviceSlug);

  return (
    <div className="bg-white">
      {/* Hero + answer-first */}
      <section className="bg-gradient-to-b from-cream via-white to-white pt-10 sm:pt-16 pb-12 sm:pb-16">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky mb-4">
            Condition
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-navy leading-[1.05]">
            {condition.headline}
          </h1>
          <div className="mt-6 rounded-2xl border border-sky/30 bg-sky/5 px-6 py-5">
            <p className="text-base sm:text-lg leading-relaxed text-navy/85">
              {condition.answerFirst}
            </p>
          </div>
          <div className="mt-6">
            <MedicalDisclaimer />
          </div>
        </div>
      </section>

      {/* About the condition (neutral) */}
      <section className="bg-white pb-12 sm:pb-16">
        <div className="mx-auto max-w-5xl px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-7 space-y-5">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy">
              About {condition.name.toLowerCase()}
            </h2>
            {condition.about.map((p, i) => (
              <Reveal key={i} delay={i * 50}>
                <p className="text-base leading-[1.8] text-navy/70">{p}</p>
              </Reveal>
            ))}
          </div>
          <div className="lg:col-span-5">
            <Reveal>
              <div className="rounded-3xl bg-cream/70 border border-beige/70 p-6 sm:p-8">
                <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-magenta mb-4">
                  How compounding personalizes care
                </h3>
                <ul className="space-y-2.5">
                  {condition.personalization.map((w) => (
                    <li key={w} className="flex items-start gap-3 text-sm text-navy/80">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-magenta shrink-0" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Compounded options (capability-framed) */}
      <section className="bg-cream/40 py-14 sm:py-20 border-y border-beige/60">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-2">
            Compounded options a provider may prescribe
          </h2>
          <p className="text-navy/65 mb-8 max-w-2xl">
            These are examples of preparations a licensed provider may prescribe — not
            recommendations. All require a prescription and are not FDA-approved.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {condition.compoundedOptions.map((o) => (
              <div
                key={o}
                className="rounded-2xl border border-beige/70 bg-white p-5 text-sm text-navy/80"
              >
                {o}
              </div>
            ))}
          </div>

          {service && (
            <div className="mt-10 rounded-2xl bg-white border border-beige/70 p-6 sm:p-8">
              <h3 className="text-lg font-bold text-navy mb-2">
                Related service: {service.name}
              </h3>
              <p className="text-sm text-navy/65 mb-5">{service.answerFirst}</p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/services/${service.slug}`}
                  className="inline-flex items-center gap-2 rounded-full border-2 border-navy/15 px-5 py-2.5 text-sm font-semibold text-navy hover:border-magenta hover:text-magenta transition-colors"
                >
                  Explore {service.name}
                </Link>
                <TrackedLink
                  href={SITE.onboarding}
                  event="cta_onboarding_start"
                  eventParams={{ location: "condition", condition: condition.slug }}
                  className="inline-flex items-center gap-2 rounded-full bg-magenta px-5 py-2.5 text-sm font-semibold text-white hover:bg-magenta/90 transition-colors"
                >
                  Prescribe as a provider
                </TrackedLink>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* FAQ */}
      {condition.faqs.length > 0 && (
        <section className="bg-white py-14 sm:py-20">
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-8">
              {condition.name} FAQ
            </h2>
            <div className="space-y-6">
              {condition.faqs.map((f) => (
                <div key={f.question} className="border-b border-beige pb-6">
                  <h3 className="text-base font-bold text-navy mb-2">{f.question}</h3>
                  <p className="text-sm leading-relaxed text-navy/70">{f.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related + disclaimer footer */}
      <section className="bg-cream/40 py-12 sm:py-16 border-t border-beige/60">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-navy/60 mb-4">
            Related
          </h2>
          <div className="flex flex-wrap gap-3 mb-8">
            {condition.related.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="rounded-full bg-white border border-beige px-5 py-2.5 text-sm font-semibold text-navy hover:border-magenta hover:text-magenta transition-colors"
              >
                {r.label}
              </Link>
            ))}
            <TrackedLink
              href={CONTACT.phoneHref}
              event="cta_call"
              eventParams={{ location: "condition", condition: condition.slug }}
              className="rounded-full bg-white border border-beige px-5 py-2.5 text-sm font-semibold text-navy hover:border-magenta hover:text-magenta transition-colors"
            >
              Call {CONTACT.phone}
            </TrackedLink>
          </div>
          <MedicalDisclaimer variant="compact" />
        </div>
      </section>
    </div>
  );
}
