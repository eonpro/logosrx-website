"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addPartnerTransaction,
  importPartnerTransactionsCsv,
} from "../actions";

const inputClass =
  "h-10 rounded-2xl border border-beige-dark bg-white px-3.5 text-sm text-navy outline-none transition-all placeholder:text-navy/35 focus:border-navy focus:ring-2 focus:ring-navy/10";

const labelClass =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-navy/45";

export default function TransactionEntry({
  clinics,
}: {
  clinics: { id: number; label: string }[];
}) {
  const router = useRouter();
  const [clinicId, setClinicId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [cost, setCost] = useState("");
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [csvText, setCsvText] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [pending, startTransition] = useTransition();

  function addManual() {
    setError("");
    setNotice("");
    setCsvErrors([]);
    if (!clinicId) {
      setError("Select a clinic.");
      return;
    }
    const amountDollars = Number(amount);
    if (!Number.isFinite(amountDollars) || amountDollars < 0) {
      setError("Enter a valid revenue amount.");
      return;
    }
    const costDollars = cost.trim() === "" ? null : Number(cost);
    if (costDollars != null && (!Number.isFinite(costDollars) || costDollars < 0)) {
      setError("Enter a valid cost amount.");
      return;
    }
    startTransition(async () => {
      const res = await addPartnerTransaction({
        clinicId: Number(clinicId),
        dateIso: date,
        amountDollars,
        costDollars,
        description,
        reference,
      });
      if (!res.ok) {
        setError(res.error ?? "Could not record the transaction.");
        return;
      }
      setAmount("");
      setCost("");
      setDescription("");
      setReference("");
      setNotice("Transaction recorded — commission entries generated.");
      // Show the new row in the table below without a manual reload.
      router.refresh();
    });
  }

  function importCsv() {
    setError("");
    setNotice("");
    setCsvErrors([]);
    if (!csvText.trim()) {
      setError("Paste CSV content to import.");
      return;
    }
    startTransition(async () => {
      const res = await importPartnerTransactionsCsv(csvText);
      setCsvErrors(res.errors);
      if (res.imported > 0) {
        setNotice(
          `${res.imported} transaction${res.imported === 1 ? "" : "s"} imported.`,
        );
        setCsvText("");
        router.refresh();
      } else if (res.errors.length === 0) {
        setError("Nothing to import.");
      }
    });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <div className="rounded-3xl border border-beige/70 bg-white p-6 shadow-soft sm:p-7">
        <h2 className="text-sm font-semibold text-navy">Add a transaction</h2>
        <form
          className="mt-4 flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            addManual();
          }}
        >
          <label className="flex flex-col gap-1">
            <span className={labelClass}>
              Clinic (attributed only)
            </span>
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
              <span className={labelClass}>Date</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputClass}
                required
              />
            </label>
            <label className="flex flex-1 flex-col gap-1">
              <span className={labelClass}>
                Revenue ($)
              </span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="1250.00"
                className={inputClass}
                required
              />
            </label>
            <label className="flex flex-1 flex-col gap-1">
              <span className={labelClass}>
                Cost ($) — margin orgs
              </span>
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
              Description (optional)
            </span>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={300}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>
              Reference (optional, e.g. LifeFile order id)
            </span>
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              maxLength={120}
              className={inputClass}
            />
          </label>
          <button
            type="submit"
            disabled={pending}
            className="mt-1 h-10 rounded-full bg-magenta px-6 text-sm font-semibold text-white transition-all hover:bg-magenta-dark active:scale-[0.98] disabled:opacity-60"
          >
            {pending ? "Working…" : "Record transaction"}
          </button>
        </form>
      </div>

      <div className="rounded-3xl border border-beige/70 bg-white p-6 shadow-soft sm:p-7">
        <h2 className="text-sm font-semibold text-navy">Import CSV</h2>
        <p className="mt-1 text-xs text-navy/60">
          Header row required:{" "}
          <code className="rounded bg-cream px-1 py-0.5">
            clinic_id (or clinic_email), date, amount, description, reference
          </code>
        </p>
        <textarea
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          placeholder={
            "clinic_id,date,amount,description,reference\n42,2026-06-01,1250.00,June order,LF-10293"
          }
          className="mt-3 h-44 w-full resize-none rounded-2xl border border-beige-dark bg-white p-4 font-mono text-xs text-navy outline-none transition-all placeholder:text-navy/35 focus:border-navy focus:ring-2 focus:ring-navy/10"
        />
        <button
          type="button"
          disabled={pending}
          onClick={importCsv}
          className="mt-3 h-10 rounded-full bg-navy px-6 text-sm font-semibold text-white transition-all hover:bg-navy-light active:scale-[0.98] disabled:opacity-60"
        >
          {pending ? "Importing…" : "Import"}
        </button>
        {csvErrors.length > 0 && (
          <ul
            role="alert"
            className="mt-3 max-h-32 space-y-1 overflow-y-auto text-xs text-red-600"
          >
            {csvErrors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}
      </div>

      {(error || notice) && (
        <div className="xl:col-span-2">
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
        </div>
      )}
    </div>
  );
}
