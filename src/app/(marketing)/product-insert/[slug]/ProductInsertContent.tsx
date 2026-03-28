"use client";

export default function ProductInsertContent() {
  return (
    <div className="flex items-center gap-3 no-print">
      <button
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-full border-2 border-navy/20 px-5 py-2.5 text-sm font-semibold text-navy hover:border-magenta hover:text-magenta transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M4 6V1h8v5M4 12H2a1 1 0 01-1-1V7a1 1 0 011-1h12a1 1 0 011 1v4a1 1 0 01-1 1h-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="4" y="9" width="8" height="6" rx="0.5" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        Print
      </button>
    </div>
  );
}
