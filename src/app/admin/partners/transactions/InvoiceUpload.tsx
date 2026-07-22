"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const inputClass =
  "h-10 rounded-2xl border border-beige-dark bg-white px-3.5 text-sm text-navy outline-none transition-all placeholder:text-navy/35 focus:border-plum focus:ring-2 focus:ring-plum/10";

const labelClass =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45";

/**
 * Uploads a pharmacy invoice PDF for an attributed clinic. The server stores
 * the PDF privately and records the sale as a transaction, so the clinic's
 * partner org / sales rep gets commission credit automatically.
 */
export default function InvoiceUpload({
  clinics,
}: {
  clinics: { id: number; label: string }[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [clinicId, setClinicId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [cost, setCost] = useState("");
  const [reference, setReference] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [uploading, setUploading] = useState(false);

  function reset() {
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
    setAmount("");
    setCost("");
    setReference("");
    setDescription("");
  }

  async function submit() {
    setError("");
    setNotice("");
    if (!file) {
      setError("Attach the invoice PDF.");
      return;
    }
    if (!clinicId) {
      setError("Select a clinic.");
      return;
    }
    const amountDollars = Number(amount);
    if (!Number.isFinite(amountDollars) || amountDollars < 0) {
      setError("Enter a valid invoice total.");
      return;
    }

    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("clinicId", clinicId);
      body.append("dateIso", date);
      body.append("amountDollars", amount);
      body.append("costDollars", cost);
      body.append("reference", reference);
      body.append("description", description);

      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        body,
      });
      const data = (await res.json()) as {
        success?: boolean;
        error?: string;
      };
      if (!res.ok || !data.success) {
        setError(data.error ?? "Upload failed. Please try again.");
        return;
      }
      reset();
      setNotice(
        "Invoice uploaded — transaction recorded and commission credited.",
      );
      router.refresh();
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-3xl border border-beige/70 bg-white p-6 shadow-soft sm:p-7">
      <h2 className="text-sm font-semibold text-navy">Upload an invoice</h2>
      <p className="mt-1 text-xs text-navy/60">
        Attach a pharmacy invoice PDF to an attributed clinic — the sale is
        recorded and the sales rep&apos;s commission is credited automatically.
      </p>
      <form
        className="mt-4 flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Invoice PDF</span>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,.pdf"
            required
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="rounded-2xl border border-beige-dark bg-white px-3.5 py-2 text-sm text-navy file:mr-3 file:rounded-full file:border-0 file:bg-cream file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-navy/70"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Clinic (attributed only)</span>
          <select
            value={clinicId}
            onChange={(e) => setClinicId(e.target.value)}
            className={inputClass}
            required
          >
            <option value="">Select a clinic…</option>
            {clinics.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex gap-3">
          <label className="flex flex-1 flex-col gap-1">
            <span className={labelClass}>Invoice date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputClass}
              required
            />
          </label>
          <label className="flex flex-1 flex-col gap-1">
            <span className={labelClass}>Total ($)</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="210.00"
              className={inputClass}
              required
            />
          </label>
          <label className="flex flex-1 flex-col gap-1">
            <span className={labelClass}>Cost ($) — margin orgs</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="optional"
              className={inputClass}
            />
          </label>
        </div>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>
            Order # / reference (optional — prevents duplicates)
          </span>
          <input
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            maxLength={120}
            placeholder="e.g. 103550076"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>Description (optional)</span>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={300}
            className={inputClass}
          />
        </label>
        <button
          type="submit"
          disabled={uploading}
          className="mt-1 h-10 rounded-full bg-magenta px-6 text-sm font-semibold text-white transition-all hover:bg-magenta-dark active:scale-[0.98] disabled:opacity-60"
        >
          {uploading ? "Uploading…" : "Upload invoice & record sale"}
        </button>
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
    </div>
  );
}
