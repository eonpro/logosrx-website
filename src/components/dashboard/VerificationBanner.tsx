import type { VerificationStatus } from "@/lib/onboarding/data";

/**
 * Account verification status banner. Plain presentational component (no
 * hooks), safe to render from server or client. Shared by the storefront and
 * the account editor.
 */
export default function VerificationBanner({
  status,
}: {
  status: VerificationStatus;
}) {
  if (status === "verified") {
    return (
      <div className="mb-6 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
        <span className="text-base">✓</span>
        <span>
          Your account is <strong>verified</strong>. You&rsquo;re all set.
        </span>
      </div>
    );
  }
  if (status === "rejected") {
    return (
      <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        We were unable to verify your account. Please contact{" "}
        <a href="mailto:support@logosrx.com" className="font-semibold underline">
          support@logosrx.com
        </a>{" "}
        so we can help resolve this.
      </div>
    );
  }
  return (
    <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
      <strong>Account pending verification.</strong> Our team is reviewing your
      practice and provider information. You can keep your profile up to date in
      the meantime — we&rsquo;ll be in touch once your account is approved.
    </div>
  );
}
