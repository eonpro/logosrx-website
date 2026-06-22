"use client";

export default function PrintButton({ label = "Print / Save PDF" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-full border border-beige bg-white px-5 py-2 text-sm font-semibold text-navy/70 transition-colors hover:border-navy/30 print:hidden"
    >
      {label}
    </button>
  );
}
