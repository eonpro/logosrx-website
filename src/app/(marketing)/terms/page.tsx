import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions",
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 lg:px-8 py-20 sm:py-28">
      <h1 className="text-3xl sm:text-4xl font-bold text-navy mb-8">
        Terms &amp; Conditions
      </h1>

      <div className="prose prose-navy max-w-none space-y-6 text-navy/70 text-sm leading-relaxed">
        <p>
          <strong>Last updated:</strong> March 2026
        </p>

        <h2 className="text-lg font-semibold text-navy">1. Acceptance of Terms</h2>
        <p>
          By accessing or using the Logos RX website and services, you agree to be bound by
          these Terms &amp; Conditions. If you do not agree, please do not use our services.
        </p>

        <h2 className="text-lg font-semibold text-navy">2. Services</h2>
        <p>
          Logos RX is a licensed 503A compounding pharmacy. All medications require a valid
          prescription from a licensed healthcare provider. We do not provide medical advice,
          diagnosis, or treatment.
        </p>

        <h2 className="text-lg font-semibold text-navy">3. Prescription Requirements</h2>
        <p>
          All compounded medications dispensed by Logos RX require a valid prescription.
          We verify all prescriptions before compounding and dispensing.
        </p>

        <h2 className="text-lg font-semibold text-navy">4. Limitation of Liability</h2>
        <p>
          Logos RX shall not be liable for any indirect, incidental, special, or
          consequential damages arising from your use of our services.
        </p>

        <h2 className="text-lg font-semibold text-navy">5. Contact</h2>
        <p>
          For questions about these terms, contact us at{" "}
          <a href="mailto:support@logosrx.com" className="text-magenta hover:underline">
            support@logosrx.com
          </a>.
        </p>
      </div>
    </div>
  );
}
