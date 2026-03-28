import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-6 lg:px-8 py-20 sm:py-28">
      <h1 className="text-3xl sm:text-4xl font-bold text-navy mb-8">
        Privacy Policy
      </h1>

      <div className="prose prose-navy max-w-none space-y-6 text-navy/70 text-sm leading-relaxed">
        <p>
          <strong>Last updated:</strong> March 2026
        </p>

        <h2 className="text-lg font-semibold text-navy">1. Information We Collect</h2>
        <p>
          We collect information you provide directly, such as when you create a provider
          account, submit a prescription, or contact us. This may include name, email,
          phone number, and professional credentials.
        </p>

        <h2 className="text-lg font-semibold text-navy">2. How We Use Your Information</h2>
        <p>
          We use your information to fulfill prescriptions, communicate about your orders,
          improve our services, and comply with legal obligations. We do not sell your
          personal information to third parties.
        </p>

        <h2 className="text-lg font-semibold text-navy">3. Data Security</h2>
        <p>
          We implement appropriate security measures to protect your personal information.
          All prescription and patient data is handled in compliance with applicable
          healthcare privacy regulations.
        </p>

        <h2 className="text-lg font-semibold text-navy">4. Your Rights</h2>
        <p>
          You have the right to access, correct, or delete your personal information.
          Contact us at{" "}
          <a href="mailto:support@logosrx.com" className="text-magenta hover:underline">
            support@logosrx.com
          </a>{" "}
          to exercise these rights.
        </p>

        <h2 className="text-lg font-semibold text-navy">5. Contact</h2>
        <p>
          For privacy-related inquiries, email{" "}
          <a href="mailto:support@logosrx.com" className="text-magenta hover:underline">
            support@logosrx.com
          </a>.
        </p>
      </div>
    </div>
  );
}
