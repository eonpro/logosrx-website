import type { Metadata } from "next";
import Link from "next/link";
import { CONTACT, CREDENTIALS, HOURS, SITE } from "@/lib/constants";
import { teamMembers } from "@/data/team";
import {
  buildMetadata,
  graph,
  medicalWebPageSchema,
  organizationSchema,
} from "@/lib/seo";
import JsonLd from "@/components/JsonLd";
import Breadcrumbs from "@/components/Breadcrumbs";

export const metadata: Metadata = buildMetadata({
  title: "About Logos RX",
  description:
    "Logos RX is a 503A compounding pharmacy in Tampa, Florida, licensed across multiple states, operating sterile and non-sterile labs under USP 795/797/800 standards.",
  path: "/about",
});

const standards = [
  {
    title: "USP <795>",
    body: "Non-sterile compounding standards governing our oral, topical, and other non-sterile preparations.",
  },
  {
    title: "USP <797>",
    body: "Sterile compounding standards for injectables and other sterile preparations, performed in a dedicated cleanroom.",
  },
  {
    title: "USP <800>",
    body: "Handling standards for hazardous drugs, protecting patients and staff throughout preparation.",
  },
];

export default function AboutPage() {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
  ];

  const schema = graph(
    organizationSchema(),
    medicalWebPageSchema({
      name: "About Logos RX",
      description:
        "Logos RX is a 503A compounding pharmacy in Tampa, Florida, licensed across multiple states, operating sterile and non-sterile labs under USP standards.",
      path: "/about",
    }),
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
              About
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-navy leading-[1.05]">
              About Logos RX
            </h1>
            <div className="mt-6 rounded-2xl border border-sky/30 bg-sky/5 px-6 py-5">
              <p className="text-base sm:text-lg leading-relaxed text-navy/85">
                {SITE.entityDescription}
              </p>
            </div>
          </div>
        </section>

        {/* Mission / what we do */}
        <section className="bg-white py-14 sm:py-20">
          <div className="mx-auto max-w-5xl px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7 space-y-5">
              <h2 className="text-2xl sm:text-3xl font-bold text-navy">What we do</h2>
              <p className="text-base leading-[1.8] text-navy/70">
                Logos RX prepares personalized medications to a provider&rsquo;s prescription
                when a commercially manufactured product doesn&rsquo;t fit a patient&rsquo;s needs —
                a different strength, a dye-free or allergen-conscious base, a combination,
                or an alternative dosage form. Every preparation is compounded per patient
                under United States Pharmacopeia (USP) standards.
              </p>
              <p className="text-base leading-[1.8] text-navy/70">
                As a 503A pharmacy, our compounded preparations are made pursuant to a valid
                prescription and are not FDA-approved. We don&rsquo;t provide medical advice;
                we compound what a licensed provider prescribes, accurately and safely.
              </p>
            </div>
            <div className="lg:col-span-5">
              <div className="rounded-3xl bg-cream/70 border border-beige/70 p-6 sm:p-8">
                <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-magenta mb-4">
                  At a glance
                </h3>
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-navy/50">Headquarters</dt>
                    <dd className="font-semibold text-navy">{CONTACT.address.full}</dd>
                  </div>
                  <div>
                    <dt className="text-navy/50">Licensed jurisdictions</dt>
                    <dd className="font-semibold text-navy">Multiple U.S. states</dd>
                  </div>
                  <div>
                    <dt className="text-navy/50">Labs</dt>
                    <dd className="font-semibold text-navy">Sterile &amp; non-sterile</dd>
                  </div>
                  <div>
                    <dt className="text-navy/50">Retail hours</dt>
                    <dd className="font-semibold text-navy">{HOURS.retail}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </section>

        {/* Credentials */}
        <section className="bg-cream/40 py-14 sm:py-20 border-y border-beige/60">
          <div className="mx-auto max-w-5xl px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-2">
              Accreditations &amp; standards
            </h2>
            <p className="text-navy/65 mb-8 max-w-2xl">
              Trust in a compounding pharmacy comes from verifiable standards. Here&rsquo;s
              what we hold ourselves to.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
              {CREDENTIALS.map((c) => (
                <div key={c.name} className="rounded-2xl border border-beige/70 bg-white p-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-magenta mb-1.5">
                    {c.category}
                  </p>
                  <p className="text-base font-bold text-navy">{c.name}</p>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {standards.map((s) => (
                <div key={s.title} className="rounded-2xl bg-white border border-beige/70 p-6">
                  <h3 className="text-lg font-bold text-navy mb-2">{s.title}</h3>
                  <p className="text-sm text-navy/70 leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team — renders only when real staff are supplied (see src/data/team.ts) */}
        {teamMembers.length > 0 && (
          <section className="bg-white py-14 sm:py-20">
            <div className="mx-auto max-w-5xl px-6 lg:px-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-navy mb-8">Our team</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {teamMembers.map((m) => (
                  <div key={m.name} className="rounded-2xl border border-beige/70 bg-cream/40 p-6">
                    <h3 className="text-base font-bold text-navy">
                      {m.name}
                      {m.credential ? `, ${m.credential}` : ""}
                    </h3>
                    <p className="text-xs font-semibold uppercase tracking-wider text-magenta mt-1">
                      {m.role}
                    </p>
                    <p className="mt-3 text-sm text-navy/70 leading-relaxed">{m.bio}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="bg-cream/40 py-12 sm:py-16 border-t border-beige/60">
          <div className="mx-auto max-w-5xl px-6 lg:px-8 text-center">
            <h2 className="text-xl sm:text-2xl font-bold text-navy mb-3">
              Work with Logos RX
            </h2>
            <p className="text-navy/65 mb-6 text-sm max-w-xl mx-auto">
              Providers can prescribe through our portal; patients and partners can reach
              our team directly.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link
                href="/providers"
                className="inline-flex items-center gap-2 rounded-full bg-magenta px-6 py-3 text-sm font-semibold text-white hover:bg-magenta/90 transition-colors"
              >
                For providers
              </Link>
              <a
                href={CONTACT.emailHref}
                className="inline-flex items-center gap-2 rounded-full border-2 border-navy/15 px-6 py-3 text-sm font-semibold text-navy hover:border-magenta hover:text-magenta transition-colors"
              >
                {CONTACT.email}
              </a>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
