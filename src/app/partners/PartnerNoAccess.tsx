import Link from "next/link";

/**
 * Rendered by partner pages when the signed-in user has no active partner
 * identity (not a partner, pending application, or suspended).
 */
export default function PartnerNoAccess() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream p-8">
      <div className="max-w-md rounded-2xl border border-beige bg-white p-10 text-center">
        <h1 className="text-xl font-bold text-navy">No partner access</h1>
        <p className="mt-3 text-sm text-navy/70">
          This account isn&rsquo;t linked to an active partner organization.
          If you applied recently, your application may still be under review.
          If you believe this is a mistake, contact your organization or the
          Logos RX team.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3">
          <Link
            href="/partners/apply"
            className="inline-block rounded-full bg-magenta px-6 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Apply to the partner program
          </Link>
          <Link href="/" className="text-sm text-navy/60 hover:text-navy">
            Back to logosrx.com
          </Link>
        </div>
      </div>
    </div>
  );
}
