import type { Metadata } from "next";
import ClinicSignupForm from "@/components/ClinicSignupForm";
import { CONTACT } from "@/lib/constants";

export const metadata: Metadata = {
  title: "New Provider Sign-Up",
  description:
    "Register your clinic or practice to partner with Logos RX and start prescribing personalized compounded medications for your patients.",
};

export default function ClinicSignupPage() {
  return (
    <>
      <section className="bg-gradient-to-b from-cream to-white py-20 sm:py-28">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase text-magenta mb-3">
            New Provider
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-navy leading-tight mb-6">
            Partner with Logos RX
          </h1>
          <p className="text-lg text-navy/60 leading-relaxed max-w-2xl">
            Join thousands of providers who trust Logos RX for personalized compounded
            medications. Fill out the form below and our team will guide you through
            the onboarding process.
          </p>
        </div>
      </section>

      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-6 lg:px-8">
          <ClinicSignupForm />
        </div>
      </section>

      <section className="bg-cream py-16">
        <div className="mx-auto max-w-3xl px-6 lg:px-8 text-center">
          <h3 className="text-xl font-bold text-navy mb-3">
            Prefer to speak with someone?
          </h3>
          <p className="text-navy/50 text-sm mb-6">
            Our provider relations team is here to answer any questions.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href={CONTACT.phoneHref}
              className="inline-flex items-center gap-2 rounded-full bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy-light transition-colors"
            >
              Call {CONTACT.phone}
            </a>
            <a
              href={CONTACT.emailHref}
              className="inline-flex items-center gap-2 rounded-full border-2 border-navy/20 px-6 py-3 text-sm font-semibold text-navy hover:border-magenta hover:text-magenta transition-colors"
            >
              Email Us
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
