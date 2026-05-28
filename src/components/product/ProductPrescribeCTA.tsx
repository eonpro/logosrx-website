import { CONTACT, SITE } from "@/lib/constants";
import Reveal from "../Reveal";

interface ProductPrescribeCTAProps {
  productName: string;
}

export default function ProductPrescribeCTA({ productName }: ProductPrescribeCTAProps) {
  return (
    <section className="bg-white pt-4 pb-20 sm:pb-28" data-header-theme="dark">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-navy-deep px-6 py-14 sm:px-12 sm:py-20">
            {/* Decorative glow */}
            <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-magenta/30 blur-3xl" aria-hidden="true" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-purple/30 blur-3xl" aria-hidden="true" />

            <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-magenta-light mb-3">
                  Provider workflow
                </p>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-[1.1] max-w-2xl">
                  Ready to prescribe {productName}?
                </h2>
                <p className="mt-5 text-base sm:text-lg leading-relaxed text-white/75 max-w-xl">
                  Submit a prescription through the Logos RX provider portal, or
                  reach out to our pharmacy team for formulary, dosing, or
                  patient-onboarding questions.
                </p>
              </div>

              <div className="lg:col-span-5 flex flex-col gap-3 lg:items-end">
                <a
                  href={SITE.onboarding}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-magenta px-8 py-4 text-sm font-semibold text-white hover:bg-magenta-dark transition-colors"
                >
                  Prescribe via Onboarding Portal
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <path d="M4 10l6-6M5 4h5v5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </a>
                <a
                  href={CONTACT.emailHref}
                  className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/15 px-8 py-4 text-sm font-semibold text-white/85 hover:border-magenta hover:text-white transition-colors"
                >
                  Contact our pharmacy team
                </a>
                <p className="text-xs text-white/55 mt-2 text-center lg:text-right">
                  Or call{" "}
                  <a
                    href={CONTACT.phoneHref}
                    className="text-magenta-light hover:text-white transition-colors"
                  >
                    {CONTACT.phone}
                  </a>
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
