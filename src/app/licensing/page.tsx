import type { Metadata } from "next";
import { SITE } from "@/lib/constants";
import { STATE_LICENSES } from "@/data/licenses";
import USLicenseMap from "@/components/USLicenseMap";

export const metadata: Metadata = {
  title: "State Licensure",
  description: `Jurisdictions where ${SITE.legalName} holds an active pharmacy license.`,
  // Private share link — never index or follow. Also disallowed in robots.ts.
  robots: { index: false, follow: false },
};

/**
 * `/licensing` — private, unlisted licensure summary for sharing with
 * partners, providers, and regulators. Not linked from any public nav, kept
 * out of the sitemap, and marked noindex + robots-disallowed. A US map shows
 * licensed jurisdictions in brand navy (hover a state for its license
 * number), followed by the full license table.
 */
export default function LicensingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white via-white to-[#262262]/5 px-6 py-14">
      <div className="mx-auto w-full max-w-5xl">
        <header className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-magenta">
            {SITE.name} · Regulatory
          </p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-navy sm:text-4xl">
            State Licensure
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-navy/70">
            {SITE.legalName} holds an active pharmacy license in{" "}
            {STATE_LICENSES.length} U.S. jurisdictions. States shown in navy
            are licensed; hover any state for its license number.
          </p>
        </header>

        {/* Map */}
        <div className="mt-10 rounded-3xl border border-navy/10 bg-white p-6 shadow-xl shadow-navy/5 sm:p-10">
          <USLicenseMap />
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm text-navy/70">
            <span className="inline-flex items-center gap-2">
              <span
                className="h-3.5 w-3.5 rounded-sm bg-navy"
                aria-hidden="true"
              />
              Licensed ({STATE_LICENSES.length})
            </span>
            <span className="inline-flex items-center gap-2">
              <span
                className="h-3.5 w-3.5 rounded-sm bg-[#E2E1DD]"
                aria-hidden="true"
              />
              Not currently licensed
            </span>
          </div>
        </div>

        {/* License table */}
        <div className="mt-10 overflow-hidden rounded-3xl border border-navy/10 bg-white shadow-xl shadow-navy/5">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">
              Active pharmacy licenses held by {SITE.legalName}, by
              jurisdiction
            </caption>
            <thead>
              <tr className="border-b border-navy/10 bg-navy/[0.03]">
                <th
                  scope="col"
                  className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-navy/60"
                >
                  Jurisdiction
                </th>
                <th
                  scope="col"
                  className="px-6 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-navy/60"
                >
                  License number
                </th>
              </tr>
            </thead>
            <tbody>
              {STATE_LICENSES.map((license) => (
                <tr
                  key={license.code}
                  className="border-b border-navy/5 last:border-b-0"
                >
                  <td className="px-6 py-3.5 font-medium text-navy">
                    {license.name}
                  </td>
                  <td className="px-6 py-3.5 font-mono text-[13px] tracking-tight text-navy/80">
                    {license.licenseNumber}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-8 text-center text-xs leading-relaxed text-navy/45">
          This page is a private link intended for partners, providers, and
          regulatory review. License numbers reflect {SITE.legalName}&rsquo;s
          records and are subject to renewal cycles; verify current status
          with the applicable state board of pharmacy.
        </p>
      </div>
    </main>
  );
}
