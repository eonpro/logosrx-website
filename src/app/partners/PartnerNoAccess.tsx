import Link from "next/link";
import { btnAccent, btnGhost } from "@/components/ui/portal";

/**
 * Rendered by partner pages when the signed-in user has no active partner
 * identity (not a partner, pending application, or suspended).
 */
export default function PartnerNoAccess() {
  return (
    <div className="theme-ink flex min-h-screen items-center justify-center bg-cream p-8">
      <div className="max-w-md rounded-3xl border border-beige/70 bg-white p-10 text-center shadow-soft">
        <h1 className="text-2xl font-bold tracking-tight text-navy">
          No partner access
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-navy/60">
          This account isn&rsquo;t linked to an active partner organization.
          If you applied recently, your application may still be under review.
          If you believe this is a mistake, contact your organization or the
          Logos RX team.
        </p>
        <div className="mt-6 flex flex-col items-center gap-3">
          <Link href="/partners/apply" className={btnAccent}>
            Apply to the partner program
          </Link>
          <Link href="/" className={btnGhost}>
            Back to logosrx.com
          </Link>
        </div>
      </div>
    </div>
  );
}
