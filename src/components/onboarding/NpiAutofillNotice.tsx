"use client";

import type { NpiLookupResult } from "@/lib/npi/parse-nppes";

/** Confirmation strip shown after a successful NPI registry autofill. */
export default function NpiAutofillNotice({
  provider,
}: {
  provider: NpiLookupResult;
}) {
  const specialty = provider.taxonomyDescription;
  const license = [provider.medicalLicense, provider.licenseState]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className="npi-autofill-notice rounded-2xl border border-plum/25 bg-plum/6 px-4 py-3"
      role="status"
      aria-live="polite"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-plum">
        Auto-filled from NPI registry
      </p>
      <p className="mt-1 text-[15px] font-semibold text-navy">
        {provider.firstName} {provider.lastName}
        {provider.credential ? `, ${provider.credential}` : ""}
      </p>
      <p className="mt-0.5 text-sm text-navy/60">
        {[specialty, license].filter(Boolean).join(" · ")}
        {provider.additionalLicenses.length > 0
          ? ` · +${provider.additionalLicenses.length} additional license${
              provider.additionalLicenses.length === 1 ? "" : "s"
            }`
          : ""}
      </p>
    </div>
  );
}
