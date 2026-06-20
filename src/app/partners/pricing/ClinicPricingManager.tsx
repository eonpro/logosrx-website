"use client";

import { useState, useTransition } from "react";
import { formatCents } from "@/lib/partners/commission";
import {
  resetClinicProductPrice,
  setClinicProductPrice,
} from "./actions";

interface Row {
  productId: string;
  name: string;
  strength: string | null;
  unit: string | null;
  floorCents: number;
  currentPriceCents: number | null;
}

export default function ClinicPricingManager({
  clinicId,
  clinicName,
  rows,
}: {
  clinicId: number;
  clinicName: string;
  rows: Row[];
}) {
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();

  function save(row: Row, dollars: string) {
    if (dollars.trim() === "") return;
    const priceDollars = Number(dollars);
    if (!Number.isFinite(priceDollars) || priceDollars < 0) {
      setError("Enter a valid price.");
      return;
    }
    if (Math.round(priceDollars * 100) < row.floorCents) {
      setError(
        `${row.name}: price can't be below your floor of ${formatCents(row.floorCents)}.`,
      );
      return;
    }
    setError("");
    setNotice("");
    startTransition(async () => {
      const res = await setClinicProductPrice({
        clinicId,
        productId: row.productId,
        productName: row.name,
        priceDollars,
        unit: row.unit ?? "",
      });
      if (!res.ok) setError(res.error ?? "Could not save the price.");
      else setNotice(`Saved ${row.name}.`);
    });
  }

  function reset(productId: string) {
    setError("");
    setNotice("");
    startTransition(async () => {
      const res = await resetClinicProductPrice(clinicId, productId);
      if (!res.ok) setError(res.error ?? "Could not clear the price.");
    });
  }

  return (
    <div className="rounded-2xl border border-beige bg-white p-6">
      <h2 className="text-sm font-semibold text-navy">
        Pricing for {clinicName}
      </h2>
      <p className="mt-1 text-xs text-navy/60">
        Spread (price − floor) is your margin on each sale.
      </p>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="mt-3 text-sm text-emerald-700">
          {notice}
        </p>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-navy/55">
            <tr>
              <th className="py-2 pr-4 font-semibold">Product</th>
              <th className="py-2 pr-4 font-semibold text-right">Floor</th>
              <th className="py-2 pr-4 font-semibold text-right">Price ($)</th>
              <th className="py-2 pr-4 font-semibold text-right">Margin</th>
              <th className="py-2 font-semibold" />
            </tr>
          </thead>
          <tbody className="divide-y divide-beige text-navy">
            {rows.map((row) => {
              const hasPrice = row.currentPriceCents != null;
              const margin = hasPrice
                ? row.currentPriceCents! - row.floorCents
                : null;
              return (
                <tr key={row.productId}>
                  <td className="py-2 pr-4">
                    <span className="font-medium">{row.name}</span>
                    {row.strength && (
                      <span className="block text-xs text-navy/55">
                        {row.strength}
                      </span>
                    )}
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums text-navy/70">
                    {formatCents(row.floorCents)}
                  </td>
                  <td className="py-2 pr-4 text-right">
                    <input
                      type="number"
                      min={(row.floorCents / 100).toFixed(2)}
                      step="0.01"
                      aria-label={`Selling price for ${row.name}`}
                      defaultValue={
                        hasPrice
                          ? (row.currentPriceCents! / 100).toFixed(2)
                          : ""
                      }
                      onBlur={(e) => save(row, e.target.value)}
                      placeholder="0.00"
                      className="h-9 w-28 rounded-lg border border-beige bg-cream/50 px-2 text-right text-sm tabular-nums text-navy outline-none focus:border-magenta"
                    />
                  </td>
                  <td className="py-2 pr-4 text-right tabular-nums">
                    {margin != null ? (
                      <span
                        className={margin >= 0 ? "text-emerald-700" : "text-red-600"}
                      >
                        {formatCents(margin)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-2 text-right">
                    {hasPrice && (
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => reset(row.productId)}
                        className="text-xs font-medium text-navy/60 hover:text-magenta disabled:opacity-50"
                      >
                        Clear
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
