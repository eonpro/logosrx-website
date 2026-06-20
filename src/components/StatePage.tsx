import Link from "next/link";
import type { StateLocation } from "@/data/states";
import type { CityLocation } from "@/data/locations";
import { LOCATION_SERVICES, LOCATION_FACTS } from "@/data/locations";
import { CONTACT, SITE, STATES_SERVED } from "@/lib/constants";
import Reveal from "@/components/Reveal";

/**
 * Renders a single state landing page (Tier 2). Opens with an answer-first
 * block, then state-specific copy built from real variables (region, major
 * cities, hand-written note). For Florida, `cities` deep-links to the Tampa Bay
 * city pages (Tier 1), forming the state→city internal-link mesh.
 *
 * Schema + breadcrumbs are emitted by the route; this is presentational only.
 */
export default function StatePage({
  state,
  cities = [],
}: {
  state: StateLocation;
  cities?: CityLocation[];
}) {
  const cityList = state.majorCities.join(", ");

  return (
    <div className="bg-white">
      {/* Hero + answer-first */}
      <section className="bg-gradient-to-b from-cream via-white to-white pt-10 sm:pt-16 pb-12 sm:pb-16">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky mb-4">
            State Coverage · {state.name}
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-navy leading-[1.05]">
            {state.headline}
          </h1>

          <div className="mt-6 rounded-2xl border border-sky/30 bg-sky/5 px-6 py-5">
            <p className="text-base sm:text-lg leading-relaxed text-navy/85">
              {state.answerFirst}
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
              <Reveal>
                <p className="text-base leading-[1.8] text-navy/70">
                  Logos RX serves {state.name} and {state.region} from its sterile
                  and non-sterile compounding labs in Tampa, Florida, shipping
                  personalized prescription medications to providers and patients in{" "}
                  {cityList}, and communities statewide. {state.note}
                </p>
              </Reveal>
              <Reveal delay={50}>
                <p className="text-base leading-[1.8] text-navy/70">
                  The process is simple: a {state.name}-licensed provider sends the
                  prescription to Logos RX, our pharmacists compound it to that exact
                  specification under {LOCATION_FACTS.standards} standards, and it
                  ships to the patient — with {LOCATION_FACTS.turnaround}. Every
                  compounded medication is made to order and requires a valid
                  prescription; compounded preparations are not FDA-approved.
                </p>
              </Reveal>
              <Reveal delay={100}>
                <p className="text-sm text-navy/60 leading-relaxed">
                  Don&rsquo;t see your medication or have a question about availability
                  in {state.name}? Call us at{" "}
                  <a href={CONTACT.phoneHref} className="text-magenta hover:underline">
                    {CONTACT.phone}
                  </a>
                  .
                </p>
              </Reveal>
            </div>

            {/* Facts card */}
            <div className="lg:col-span-5">
              <Reveal>
                <div className="rounded-3xl bg-cream/70 border border-beige/70 p-6 sm:p-8">
                  <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-magenta mb-4">
                    Shipping to {state.name}
                  </h2>
                  <dl className="space-y-4 text-sm">
                    <div>
                      <dt className="text-navy/55">Compounded at</dt>
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
                      <dd className="font-semibold text-navy">{LOCATION_FACTS.standards}</dd>
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

              <Reveal>
                <div className="mt-6 rounded-3xl border border-beige/70 p-6 sm:p-8">
                  <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-navy/70 mb-4">
                    Major areas served in {state.name}
                  </h2>
                  <ul className="flex flex-wrap gap-2">
                    {state.majorCities.map((c) => (
                      <li
                        key={c}
                        className="rounded-full bg-white border border-beige px-3 py-1 text-xs font-medium text-navy/70"
                      >
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Florida-only: Tampa Bay city deep-links */}
      {cities.length > 0 && (
        <section className="bg-cream/40 py-14 sm:py-20 border-y border-beige/60">
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-2">
              Tampa Bay local service areas
            </h2>
            <p className="text-navy/65 mb-8 max-w-2xl">
              As our home market, the Tampa Bay metro is served directly from our
              local labs. Explore your city:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {cities.map((c) => (
                <Link
                  key={c.slug}
                  href={`/locations/fl/${c.slug}`}
                  className="rounded-2xl border border-beige/70 bg-white px-4 py-3 text-sm font-semibold text-navy hover:border-magenta hover:text-magenta transition-colors"
                >
                  {c.city}
                  {c.isFlagship && (
                    <span className="ml-2 rounded-full bg-magenta/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-magenta align-middle">
                      HQ
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Services */}
      <section className="bg-white py-14 sm:py-20">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-3">
            Compounding services available in {state.name}
          </h2>
          <p className="text-navy/65 mb-8 max-w-2xl">
            All preparations are made to a provider&rsquo;s prescription and prepared
            per patient.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {LOCATION_SERVICES.map((s) => (
              <div
                key={s}
                className="flex items-start gap-3 rounded-xl bg-cream/50 border border-beige/70 px-4 py-3"
              >
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-magenta shrink-0" />
                <span className="text-sm font-medium text-navy/80">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      {state.faqs.length > 0 && (
        <section className="bg-cream/40 py-14 sm:py-20 border-y border-beige/60">
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-8">
              {state.name} compounding pharmacy FAQ
            </h2>
            <div className="space-y-6">
              {state.faqs.map((f) => (
                <div key={f.question} className="border-b border-beige pb-6">
                  <h3 className="text-base font-bold text-navy mb-2">{f.question}</h3>
                  <p className="text-sm leading-relaxed text-navy/70">{f.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Back to all locations */}
      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-6 lg:px-8">
          <Link
            href="/locations"
            className="inline-flex items-center gap-2 rounded-full border border-beige px-5 py-2.5 text-sm font-semibold text-navy/70 hover:border-magenta hover:text-magenta transition-colors"
          >
            ← All locations &amp; service areas
          </Link>
        </div>
      </section>
    </div>
  );
}
