/**
 * Read-only render of an executed partner agreement from its immutable snapshot
 * (`partner_agreements` row). Shows the exact text that was signed plus the
 * signature block (signer identity, captured signature image, date, IP, and the
 * document hash). Shared by the partner portal view, the admin view, and print.
 * Presentational only — safe in server components.
 */
export interface ExecutedAgreementData {
  documentTitle: string;
  documentVersion: string;
  documentText: string;
  documentHash: string;
  legalEntityName: string | null;
  signerName: string;
  signerTitle: string | null;
  signerEmail: string | null;
  signatureImage: string;
  signedIp: string | null;
  signedAt: Date;
}

function formatDateTime(d: Date): string {
  return d.toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

export default function ExecutedAgreement({
  agreement,
  className = "",
}: {
  agreement: ExecutedAgreementData;
  className?: string;
}) {
  return (
    <article
      className={`rounded-2xl bg-white p-6 text-navy shadow-sm sm:p-10 ${className}`}
    >
      <header className="mb-6 border-b border-beige pb-4 text-center">
        <h2 className="text-lg font-bold tracking-tight text-navy sm:text-xl">
          {agreement.documentTitle}
        </h2>
        <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-navy/40">
          Version {agreement.documentVersion} · Executed{" "}
          {formatDateTime(agreement.signedAt)}
        </p>
      </header>

      <div className="whitespace-pre-wrap text-[13px] leading-relaxed text-navy/80">
        {agreement.documentText}
      </div>

      <div className="mt-8 grid gap-6 border-t border-beige pt-6 sm:grid-cols-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-navy/45">
            Signature
          </p>
          <div className="mt-2 inline-block rounded-lg border border-beige bg-cream/40 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={agreement.signatureImage}
              alt={`Signature of ${agreement.signerName}`}
              className="h-24 w-auto"
            />
          </div>
        </div>
        <dl className="space-y-1.5 text-[13px] text-navy/80">
          <Row label="Signed by" value={agreement.signerName} />
          {agreement.signerTitle && (
            <Row label="Title" value={agreement.signerTitle} />
          )}
          {agreement.legalEntityName && (
            <Row label="Entity" value={agreement.legalEntityName} />
          )}
          {agreement.signerEmail && (
            <Row label="Email" value={agreement.signerEmail} />
          )}
          <Row label="Date" value={formatDateTime(agreement.signedAt)} />
          {agreement.signedIp && <Row label="IP address" value={agreement.signedIp} />}
          <Row
            label="Document hash"
            value={
              <span className="break-all font-mono text-[11px]">
                {agreement.documentHash}
              </span>
            }
          />
        </dl>
      </div>

      <p className="mt-6 text-[11px] text-navy/40">
        Executed electronically and retained by Logos RX and the signing party.
      </p>
    </article>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex gap-2">
      <dt className="min-w-[92px] shrink-0 text-navy/45">{label}</dt>
      <dd className="font-medium text-navy">{value}</dd>
    </div>
  );
}
