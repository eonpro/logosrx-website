import type { Metadata } from "next";
import Link from "next/link";
import { services } from "@/data/services";
import { CONTACT, SITE, STATES_SERVED } from "@/lib/constants";
import {
  buildMetadata,
  graph,
  medicalWebPageSchema,
  faqPageSchema,
} from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";
import TrackedLink from "@/components/TrackedLink";

export const metadata: Metadata = buildMetadata({
  title: "For Providers & Clinics",
  description:
    "Prescribe compounded medications through Logos RX, a 503A compounding pharmacy in Tampa licensed in 25 states. Provider onboarding, formulary, and the LifeFile portal.",
  path: "/providers",
});

const providerFaqs = [
  {
    question: "How do I become a prescribing provider with Logos RX?",
    answer:
      "Create an account through our provider onboarding portal. Our team verifies your information and guides you through setup, after which you can begin prescribing compounded medications.",
  },
  {
    question: "How are prescriptions submitted?",
    answer:
      "Logos RX processes prescriptions through the LifeFile provider portal. Existing providers log in to LifeFile to prescribe; new providers complete onboarding first.",
  },
  {
    question: "Which states can you ship to?",
    answer: `Logos RX is licensed in ${STATES_SERVED.length} U.S. jurisdictions and ships compounded prescriptions to providers and patients within those states.`,
  },
  {
    question: "What quality standards do you follow?",
    answer:
      "We compound under USP <795>, <797>, and <800> in dedicated sterile and non-sterile labs, with third-party testing and accreditation.",
  },
];

const steps = [
  {
    n: "1",
    title: "Create your account",
    body: "Complete the provider onboarding wizard with your practice and licensing information.",
  },
  {
    n: "2",
    title: "Get verified",
    body: "Our team reviews and activates your account, then sets you up in the LifeFile portal.",
  },
  {
    n: "3",
    title: "Prescribe",
    body: "Submit prescriptions through LifeFile; we compound and ship within our licensed states.",
  },
];

export default function ProvidersHub() {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "For Providers", path: "/providers" },
  ];

  const schema = graph(
    medicalWebPageSchema({
      name: "For Providers & Clinics",
      description:
        "Provider information for prescribing compounded medications through Logos RX, a 503A compounding pharmacy in Tampa.",
      path: "/providers",
    }),
    faqPageSchema(providerFaqs),
  );

  return (
    <>
      <JsonLd data={schema} />
      <Breadcrumbs items={crumbs} />

      <div className="bg-white">
        {/* Hero */}
        <section className="bg-gradient-to-b from-cream via-white to-white pt-10 sm:pt-16 pb-12 sm:pb-16">
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sky mb-4">
              For Providers &amp; Clinics
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-navy leading-[1.05]">
              Prescribe with confidence
            </h1>
            <div className="mt-6 rounded-2xl border border-sky/30 bg-sky/5 px-6 py-5">
              <p className="text-base sm:text-lg leading-relaxed text-navy/85">
                Logos RX is a 503A compounding pharmacy in Tampa, Florida, licensed in{" "}
                {STATES_SERVED.length} U.S. jurisdictions, with sterile and non-sterile
                labs. Providers prescribe through the LifeFile portal; we compound each
                preparation to specification and ship it within our licensed states.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <TrackedLink
                href={SITE.onboarding}
                event="cta_onboarding_start"
                eventParams={{ location: "providers_hero" }}
                className="inline-flex items-center gap-2 rounded-full bg-magenta px-6 py-3 text-sm font-semibold text-white hover:bg-magenta/90 transition-colors"
              >
                Start onboarding
              </TrackedLink>
              <TrackedLink
                href={SITE.lifefilePortal}
                event="cta_lifefile_login"
                eventParams={{ location: "providers_hero" }}
                newTab
                className="inline-flex items-center gap-2 rounded-full border-2 border-navy/15 px-6 py-3 text-sm font-semibold text-navy hover:border-magenta hover:text-magenta transition-colors"
              >
                Existing provider login
              </TrackedLink>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-white py-14 sm:py-20">
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-8">
              How to get started
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {steps.map((s) => (
                <div key={s.n} className="rounded-2xl border border-beige/70 bg-cream/40 p-6">
                  <div className="w-10 h-10 rounded-full bg-magenta text-white flex items-center justify-center font-bold mb-4">
                    {s.n}
                  </div>
                  <h3 className="text-base font-bold text-navy mb-2">{s.title}</h3>
                  <p className="text-sm text-navy/70 leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Formulary / services */}
        <section className="bg-cream/40 py-14 sm:py-20 border-y border-beige/60">
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-2">
              What you can prescribe
            </h2>
            <p className="text-navy/65 mb-8 max-w-2xl">
              We compound across these therapeutic areas. Explore each for capabilities
              and example formulations.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {services.map((s) => (
                <Link
                  key={s.slug}
                  href={`/services/${s.slug}`}
                  className="group rounded-2xl border border-beige/70 bg-white p-5 hover:border-magenta/40 hover:shadow-sm transition-all"
                >
                  <h3 className="text-base font-bold text-navy group-hover:text-magenta transition-colors">
                    {s.name}
                  </h3>
                  <p className="mt-1.5 text-sm text-navy/60 line-clamp-2">{s.metaDescription}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-white py-14 sm:py-20">
          <div className="mx-auto max-w-3xl px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-8">
              Provider FAQ
            </h2>
            <div className="space-y-6">
              {providerFaqs.map((f) => (
                <div key={f.question} className="border-b border-beige pb-6">
                  <h3 className="text-base font-bold text-navy mb-2">{f.question}</h3>
                  <p className="text-sm leading-relaxed text-navy/70">{f.answer}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/locations"
                className="rounded-full border border-beige px-5 py-2.5 text-sm font-semibold text-navy hover:border-magenta hover:text-magenta transition-colors"
              >
                States we serve
              </Link>
              <TrackedLink
                href={CONTACT.phoneHref}
                event="cta_call"
                eventParams={{ location: "providers_faq" }}
                className="rounded-full border border-beige px-5 py-2.5 text-sm font-semibold text-navy hover:border-magenta hover:text-magenta transition-colors"
              >
                Call {CONTACT.phone}
              </TrackedLink>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
