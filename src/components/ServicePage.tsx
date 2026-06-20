import Link from "next/link";
import type { Service } from "@/data/services";
import { getProductsByCategory } from "@/data/products";
import { conditionsForService } from "@/data/conditions";
import { CONTACT, SITE } from "@/lib/constants";
import Reveal from "@/components/Reveal";
import TrackedLink from "@/components/TrackedLink";

/**
 * Renders a single service-line page: answer-first, intro, "what we compound"
 * capabilities, live related products (pulled from the catalog by category),
 * FAQ, and related reading. Schema/breadcrumbs are emitted by the route.
 */
export default function ServicePage({ service }: { service: Service }) {
  const products = getProductsByCategory(service.productCategory).slice(0, 6);
  const relatedConditions = conditionsForService(service.slug);

  return (
    <div className="bg-white">
      {/* Hero + answer-first */}
      <section className="bg-gradient-to-b from-cream via-white to-white pt-10 sm:pt-16 pb-12 sm:pb-16">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky mb-4">
            {service.eyebrow}
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-navy leading-[1.05]">
            {service.headline}
          </h1>
          <div className="mt-6 rounded-2xl border border-sky/30 bg-sky/5 px-6 py-5">
            <p className="text-base sm:text-lg leading-relaxed text-navy/85">
              {service.answerFirst}
            </p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <TrackedLink
              href={SITE.onboarding}
              event="cta_onboarding_start"
              eventParams={{ location: "service_hero", service: service.slug }}
              className="inline-flex items-center gap-2 rounded-full bg-magenta px-6 py-3 text-sm font-semibold text-white hover:bg-magenta/90 transition-colors"
            >
              Prescribe as a provider
            </TrackedLink>
            <TrackedLink
              href={CONTACT.phoneHref}
              event="cta_call"
              eventParams={{ location: "service_hero", service: service.slug }}
              className="inline-flex items-center gap-2 rounded-full border-2 border-navy/15 px-6 py-3 text-sm font-semibold text-navy hover:border-magenta hover:text-magenta transition-colors"
            >
              Call {CONTACT.phone}
            </TrackedLink>
          </div>
        </div>
      </section>

      {/* Intro + what we compound */}
      <section className="bg-white pb-14 sm:pb-20">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7 space-y-5">
              {service.intro.map((p, i) => (
                <Reveal key={i} delay={i * 50}>
                  <p className="text-base leading-[1.8] text-navy/70">{p}</p>
                </Reveal>
              ))}
            </div>
            <div className="lg:col-span-5">
              <Reveal>
                <div className="rounded-3xl bg-cream/70 border border-beige/70 p-6 sm:p-8">
                  <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-magenta mb-4">
                    What we compound
                  </h2>
                  <ul className="space-y-2.5">
                    {service.whatWeCompound.map((w) => (
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
        </div>
      </section>

      {/* Related products */}
      {products.length > 0 && (
        <section className="bg-cream/40 py-14 sm:py-20 border-y border-beige/60">
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-2">
              {service.name} formulations
            </h2>
            <p className="text-navy/65 mb-8 max-w-2xl">
              Examples of preparations in this area. All require a prescription and are
              prepared per patient; compounded medications are not FDA-approved.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((p) => (
                <Link
                  key={p.slug}
                  href={`/products/${p.slug}`}
                  className="group rounded-2xl border border-beige/70 bg-white p-5 hover:border-magenta/40 hover:shadow-sm transition-all"
                >
                  <h3 className="text-base font-bold text-navy group-hover:text-magenta transition-colors">
                    {p.name}
                  </h3>
                  {p.tagline && (
                    <p className="mt-1.5 text-sm text-navy/60 line-clamp-2">{p.tagline}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related conditions (educational) */}
      {relatedConditions.length > 0 && (
        <section className="bg-white py-14 sm:py-20">
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-2">
              Related conditions
            </h2>
            <p className="text-navy/65 mb-6 max-w-2xl">
              Educational guides on how providers use compounding in these areas. Not
              medical advice; therapy decisions are made with your provider.
            </p>
            <div className="flex flex-wrap gap-3">
              {relatedConditions.map((c) => (
                <Link
                  key={c.slug}
                  href={`/conditions/${c.slug}`}
                  className="rounded-full bg-cream/60 border border-beige px-5 py-2.5 text-sm font-semibold text-navy hover:border-magenta hover:text-magenta transition-colors"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ */}
      {service.faqs.length > 0 && (
        <section className="bg-white py-14 sm:py-20">
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-8">
              {service.name} FAQ
            </h2>
            <div className="space-y-6">
              {service.faqs.map((f) => (
                <div key={f.question} className="border-b border-beige pb-6">
                  <h3 className="text-base font-bold text-navy mb-2">{f.question}</h3>
                  <p className="text-sm leading-relaxed text-navy/70">{f.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Related */}
      <section className="bg-cream/40 py-12 sm:py-16 border-t border-beige/60">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-navy/60 mb-4">
            Related
          </h2>
          <div className="flex flex-wrap gap-3">
            {service.related.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="rounded-full bg-white border border-beige px-5 py-2.5 text-sm font-semibold text-navy hover:border-magenta hover:text-magenta transition-colors"
              >
                {r.label}
              </Link>
            ))}
            <Link
              href="/services"
              className="rounded-full bg-white border border-beige px-5 py-2.5 text-sm font-semibold text-navy/70 hover:border-magenta hover:text-magenta transition-colors"
            >
              All services →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
