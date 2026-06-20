/**
 * Standalone medical/compliance disclaimer for YMYL pages (conditions, services).
 * Keep the wording consistent everywhere it appears — it's the on-page companion
 * to the "not FDA-approved / prescription required" framing in our schema and
 * answer-first copy. Variant controls emphasis without changing the substance.
 */
export default function MedicalDisclaimer({
  variant = "default",
}: {
  variant?: "default" | "compact";
}) {
  if (variant === "compact") {
    return (
      <p className="text-xs leading-relaxed text-navy/55">
        This page is for educational purposes and is not medical advice. Compounded
        medications are not FDA-approved and require a valid prescription. Always
        consult your licensed healthcare provider.
      </p>
    );
  }

  return (
    <aside
      role="note"
      aria-label="Medical disclaimer"
      className="rounded-2xl border border-beige bg-cream/60 px-5 py-4"
    >
      <p className="text-xs font-bold uppercase tracking-[0.15em] text-navy/50 mb-1.5">
        Important
      </p>
      <p className="text-sm leading-relaxed text-navy/70">
        This information is provided for educational purposes only and is not
        medical advice, a diagnosis, or a treatment recommendation. Compounded
        (503A) preparations are not FDA-approved and are dispensed only pursuant to
        a valid prescription from a licensed provider. Logos RX does not diagnose
        conditions or determine therapy — those decisions are made between you and
        your provider. Talk to your provider about whether any therapy is right for
        you.
      </p>
    </aside>
  );
}
