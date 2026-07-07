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
      <div className="mb-6 flex items-start gap-3 rounded-2xl bg-emerald-50 px-5 py-4 text-sm text-emerald-800 ring-1 ring-inset ring-emerald-600/15">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600/10 text-emerald-700">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path
              d="M2.5 6.5L5 9l4.5-5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span>
          Your account is <strong>verified</strong>. You&rsquo;re all set.
        </span>
      </div>
    );
  }
  if (status === "rejected") {
    return (
      <div className="mb-6 flex items-start gap-3 rounded-2xl bg-red-50 px-5 py-4 text-sm text-red-800 ring-1 ring-inset ring-red-600/15">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-600/10 text-red-700">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path
              d="M3 3l6 6M9 3l-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <span>
          We were unable to verify your account. Please contact{" "}
          <a href="mailto:support@logosrx.com" className="font-semibold underline">
            support@logosrx.com
          </a>{" "}
          so we can help resolve this.
        </span>
      </div>
    );
  }
  return (
    <div className="mb-6 flex items-start gap-3 rounded-2xl bg-amber-50 px-5 py-4 text-sm text-amber-800 ring-1 ring-inset ring-amber-600/20">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-600/10 text-amber-700">
        <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path
            d="M6 3.5v3M6 8.5h.01"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span>
        <strong>Account pending verification.</strong> Our team is reviewing
        your practice and provider information. You can keep your profile up to
        date in the meantime — we&rsquo;ll be in touch once your account is
        approved.
      </span>
    </div>
  );
}
