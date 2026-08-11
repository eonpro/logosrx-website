"use client";

import { useRef, useState } from "react";
import {
  parseInvoiceCsv,
  type InvoiceCsvResult,
} from "@/lib/invoices/csv";

const inputClass =
  "h-10 rounded-2xl border border-beige-dark bg-white px-3.5 text-sm text-navy outline-none transition-all placeholder:text-navy/35 focus:border-plum focus:ring-2 focus:ring-plum/10";

const labelClass =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45";

function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}

function formatUsd(cents: number): string {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

/**
 * Builds a Logos RX–branded invoice from a LifeFile-style shipment report
 * CSV. The CSV is parsed in the browser for an instant preview (count, total,
 * date range prefill); the server re-parses the same file and renders the
 * PDF, which downloads directly — nothing is stored.
 */
export default function InvoiceBuilder({ canEdit }: { canEdit: boolean }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<InvoiceCsvResult | null>(null);
  const [clientName, setClientName] = useState("");
  const [dateOfService, setDateOfService] = useState("");
  const [total, setTotal] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [generating, setGenerating] = useState(false);

  async function onFileChange(next: File | null) {
    setFile(next);
    setPreview(null);
    setError("");
    setNotice("");
    if (!next) return;
    try {
      const parsed = parseInvoiceCsv(await next.text());
      setPreview(parsed);
      if (parsed.rows.length > 0) {
        // Prefill from the CSV; both stay editable.
        setTotal(centsToDollars(parsed.totalCents));
        if (parsed.dateRange && !dateOfService) {
          setDateOfService(parsed.dateRange.replace(/\s*-\s*/, " – "));
        }
      }
    } catch {
      setError("Could not read the file — is it a CSV export?");
    }
  }

  async function submit() {
    setError("");
    setNotice("");
    if (!file) {
      setError("Attach the transactions CSV file.");
      return;
    }
    if (!clientName.trim()) {
      setError("Enter the client name.");
      return;
    }
    if (!dateOfService.trim()) {
      setError("Enter the date of service.");
      return;
    }
    const totalDollars = Number(total.replace(/[$,\s]/g, ""));
    if (!total.trim() || !Number.isFinite(totalDollars) || totalDollars < 0) {
      setError("Enter a valid invoice total.");
      return;
    }

    setGenerating(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("clientName", clientName);
      body.append("dateOfService", dateOfService);
      body.append("totalDollars", total);
      body.append("invoiceNumber", invoiceNumber);
      body.append("notes", notes);

      const res = await fetch("/api/admin/invoice-builder", {
        method: "POST",
        body,
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(data?.error ?? "Invoice generation failed. Please try again.");
        return;
      }

      // Stream the PDF straight to a download.
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="([^"]+)"/);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = match?.[1] ?? "logos-rx-invoice.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setNotice("Invoice PDF generated and downloaded.");
    } catch {
      setError("Invoice generation failed. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  const sampleRows = preview?.rows.slice(0, 6) ?? [];

  return (
    <div className="flex flex-col gap-6">
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Transactions CSV</span>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            required
            onChange={(e) => void onFileChange(e.target.files?.[0] ?? null)}
            className="rounded-2xl border border-beige-dark bg-white px-3.5 py-2 text-sm text-navy file:mr-3 file:rounded-full file:border-0 file:bg-cream file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-navy/70"
          />
          <span className="text-[11px] text-navy/45">
            Works with shipment reports (Date Written, Date Shipped, Ship to
            State, Patient Name, Practice Name, Drug Name, Rx Qty, Rx Status,
            Rx Price, Order ID) and order-detail exports (Practice Name, Order
            ID, Patient Name, State Shipped, Medication, Qty, Price).
          </span>
        </label>

        {preview && preview.errors.length > 0 && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <p className="font-semibold">
              {preview.errors.length} problem
              {preview.errors.length === 1 ? "" : "s"} in the file:
            </p>
            <ul className="mt-1 list-inside list-disc">
              {preview.errors.slice(0, 5).map((e) => (
                <li key={e}>{e}</li>
              ))}
              {preview.errors.length > 5 && (
                <li>…and {preview.errors.length - 5} more</li>
              )}
            </ul>
          </div>
        )}

        {preview && preview.rows.length > 0 && (
          <div className="rounded-2xl bg-cream p-3 text-xs text-navy/70">
            <span className="font-semibold text-navy">
              {preview.rows.length} transactions
            </span>{" "}
            parsed · itemized total{" "}
            <span className="font-semibold text-navy">
              {formatUsd(preview.totalCents)}
            </span>
            {preview.dateRange ? ` · period ${preview.dateRange}` : ""}
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex flex-1 flex-col gap-1">
            <span className={labelClass}>Client name</span>
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              maxLength={160}
              placeholder="e.g. OpenLoop Healthcare Partners PC"
              className={inputClass}
              required
            />
          </label>
          <label className="flex flex-1 flex-col gap-1">
            <span className={labelClass}>Date of service</span>
            <input
              value={dateOfService}
              onChange={(e) => setDateOfService(e.target.value)}
              maxLength={80}
              placeholder="e.g. 07/20/2026 – 08/02/2026"
              className={inputClass}
              required
            />
          </label>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex flex-1 flex-col gap-1">
            <span className={labelClass}>Invoice total ($)</span>
            <input
              inputMode="decimal"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              placeholder="prefilled from the CSV"
              className={inputClass}
              required
            />
          </label>
          <label className="flex flex-1 flex-col gap-1">
            <span className={labelClass}>Invoice # (optional)</span>
            <input
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              maxLength={40}
              placeholder="auto-generated if blank"
              className={inputClass}
            />
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className={labelClass}>Notes (optional — shown on the invoice)</span>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            maxLength={500}
            placeholder="e.g. payment terms, PO number"
            className={inputClass}
          />
        </label>

        <button
          type="submit"
          disabled={generating || !canEdit}
          className="mt-1 h-10 rounded-full bg-magenta px-6 text-sm font-semibold text-white transition-all hover:bg-magenta-dark active:scale-[0.98] disabled:opacity-60"
        >
          {generating ? "Generating…" : "Generate invoice PDF"}
        </button>
        {!canEdit && (
          <p className="text-xs text-navy/50">
            You have view-only admin access — generating invoices requires full
            admin.
          </p>
        )}
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="text-sm text-emerald-700">
            {notice}
          </p>
        )}
      </form>

      {sampleRows.length > 0 && (
        <div>
          <h3 className={labelClass}>Preview (first {sampleRows.length} rows)</h3>
          <div className="mt-2 overflow-x-auto rounded-2xl border border-beige/70">
            <table className="w-full min-w-[720px] text-left text-xs text-navy/80">
              <thead className="bg-cream text-[10px] uppercase tracking-wide text-navy/50">
                <tr>
                  <th className="px-3 py-2">Written</th>
                  <th className="px-3 py-2">Shipped</th>
                  <th className="px-3 py-2">ST</th>
                  <th className="px-3 py-2">Patient</th>
                  <th className="px-3 py-2">Drug</th>
                  <th className="px-3 py-2 text-right">Qty</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2 text-right">Price</th>
                  <th className="px-3 py-2 text-right">Order ID</th>
                </tr>
              </thead>
              <tbody>
                {sampleRows.map((r) => (
                  <tr key={r.line} className="border-t border-beige/60">
                    <td className="px-3 py-2">{r.dateWritten ?? "—"}</td>
                    <td className="px-3 py-2">{r.dateShipped ?? "—"}</td>
                    <td className="px-3 py-2">{r.shipToState ?? "—"}</td>
                    <td className="px-3 py-2">{r.patientName ?? "—"}</td>
                    <td className="max-w-[220px] truncate px-3 py-2">
                      {r.drugName ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-right">{r.rxQty ?? "—"}</td>
                    <td className="px-3 py-2">{r.rxStatus ?? "—"}</td>
                    <td className="px-3 py-2 text-right">
                      {r.rxPriceCents != null ? formatUsd(r.rxPriceCents) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right">{r.orderId ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview && preview.rows.length > sampleRows.length && (
            <p className="mt-2 text-[11px] text-navy/45">
              …and {preview.rows.length - sampleRows.length} more rows — all of
              them are itemized in the PDF attachment.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
