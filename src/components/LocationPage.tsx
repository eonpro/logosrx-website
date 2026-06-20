import Link from "next/link";
import type { CityLocation } from "@/data/locations";
import { getCityLocation, LOCATION_SERVICES, LOCATION_FACTS } from "@/data/locations";
import { CONTACT, SITE, STATES_SERVED } from "@/lib/constants";
import Reveal from "@/components/Reveal";

/**
 * Renders a single city location page. Opens with an answer-first block (the
 * self-contained summary AI engines lift), then unique local copy, services,
 * neighborhoods served, FAQs, and an internal-link mesh to nearby cities.
 *
 * Schema + breadcrumbs are emitted by the route, not here, to keep this purely
 * presentational.
 */
export default function LocationPage({ location }: { location: CityLocation }) {
  const nearby = location.nearby
    .map(getCityLocation)
    .filter((c): c is CityLocation => Boolean(c));

  return (
    <div className="bg-white">
      {/* Hero + answer-first */}
      <section className="bg-gradient-to-b from-cream via-white to-white pt-10 sm:pt-16 pb-12 sm:pb-16">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky mb-4">
            {location.isFlagship ? "Headquarters" : "Service Area"} ·{" "}
            {location.city}, {location.state}
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-navy leading-[1.05]">
            {location.headline}
          </h1>

          {/* Answer-first TL;DR — styled callout, extractable by AI engines */}
          <div className="mt-6 rounded-2xl border border-sky/30 bg-sky/5 px-6 py-5">
            <p className="text-base sm:text-lg leading-relaxed text-navy/85">
              {location.answerFirst}
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
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
        </div>
      </section>

      {/* Intro copy */}
      <section className="bg-white pb-14 sm:pb-20">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7 space-y-5">
              {location.intro.map((p, i) => (
                <Reveal key={i} delay={i * 50}>
                  <p className="text-base leading-[1.8] text-navy/70">{p}</p>
                </Reveal>
              ))}
              <Reveal>
                <p className="text-sm text-navy/60 leading-relaxed">
                  {location.distanceNote}
                </p>
              </Reveal>
            </div>

            {/* Local facts card */}
            <div className="lg:col-span-5">
              <Reveal>
                <div className="rounded-3xl bg-cream/70 border border-beige/70 p-6 sm:p-8">
                  <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-magenta mb-4">
                    Serving {location.city}
                  </h2>
                  <dl className="space-y-4 text-sm">
                    <div>
                      <dt className="text-navy/55">Pharmacy</dt>
                      <dd className="font-semibold text-navy">{LOCATION_FACTS.address}</dd>
                    </div>
                    <div>
                      <dt className="text-navy/55">Turnaround</dt>
                      <dd className="font-semibold text-navy capitalize">
                        {LOCATION_FACTS.turnaround}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-navy/55">Quality standards</dt>
                      <dd className="font-semibold text-navy">
                        {LOCATION_FACTS.standards}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-navy/55">Licensed in</dt>
                      <dd className="font-semibold text-navy">
                        {STATES_SERVED.length} U.S. jurisdictions
                      </dd>
                    </div>
                  </dl>
                </div>
              </Reveal>

              {location.neighborhoods.length > 0 && (
                <Reveal>
                  <div className="mt-6 rounded-3xl border border-beige/70 p-6 sm:p-8">
                    <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-navy/70 mb-4">
                      Areas served near {location.city}
                    </h2>
                    <ul className="flex flex-wrap gap-2">
                      {location.neighborhoods.map((n) => (
                        <li
                          key={n}
                          className="rounded-full bg-white border border-beige px-3 py-1 text-xs font-medium text-navy/70"
                        >
                          {n}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="bg-cream/40 py-14 sm:py-20 border-y border-beige/60">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-3">
            Compounding services available in {location.city}
          </h2>
          <p className="text-navy/65 mb-8 max-w-2xl">
            All preparations are made to a provider&rsquo;s prescription. Compounded
            medications are not FDA-approved and are prepared per patient.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {LOCATION_SERVICES.map((s) => (
              <div
                key={s}
                className="flex items-start gap-3 rounded-xl bg-white border border-beige/70 px-4 py-3"
              >
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-magenta shrink-0" />
                <span className="text-sm font-medium text-navy/80">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      {location.faqs.length > 0 && (
        <section className="bg-white py-14 sm:py-20">
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-8">
              {location.city} compounding pharmacy FAQ
            </h2>
            <div className="space-y-6">
              {location.faqs.map((f) => (
                <div key={f.question} className="border-b border-beige pb-6">
                  <h3 className="text-base font-bold text-navy mb-2">{f.question}</h3>
                  <p className="text-sm leading-relaxed text-navy/70">{f.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Nearby cities */}
      {nearby.length > 0 && (
        <section className="bg-cream/40 py-14 sm:py-20 border-t border-beige/60">
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <h2 className="text-xl sm:text-2xl font-bold text-navy mb-6">
              Also serving nearby
            </h2>
            <div className="flex flex-wrap gap-3">
              {nearby.map((c) => (
                <Link
                  key={c.slug}
                  href={`/locations/fl/${c.slug}`}
                  className="rounded-full bg-white border border-beige px-5 py-2.5 text-sm font-semibold text-navy hover:border-magenta hover:text-magenta transition-colors"
                >
                  {c.city}, {c.state}
                </Link>
              ))}
              <Link
                href="/locations"
                className="rounded-full bg-white border border-beige px-5 py-2.5 text-sm font-semibold text-navy/70 hover:border-magenta hover:text-magenta transition-colors"
              >
                All locations →
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
