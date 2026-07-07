"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatCents } from "@/lib/partners/commission";
import { resetOrgFloorPrice, setOrgFloorPrice } from "../actions";
import { cardClass, theadClass } from "@/components/ui/portal";

interface ProductRow {
  productId: string;
  name: string;
  strength: string | null;
  unit: string | null;
  standardCents: number | null;
}

export default function OrgFloorManager({
  orgId,
  products,
  floors,
  active,
}: {
  orgId: number;
  products: ProductRow[];
  /** productId -> floor cents */
  floors: Record<string, number>;
  /** Whether the org is currently on the margin model (affects the hint only). */
  active: boolean;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const hasFloor = floors[p.productId] != null;
      if (!q) return hasFloor; // default view: only configured floors
      return (
        p.name.toLowerCase().includes(q) ||
        (p.strength ?? "").toLowerCase().includes(q) ||
        p.productId.toLowerCase().includes(q)
      );
    }).slice(0, 60);
  }, [products, floors, search]);

  function save(p: ProductRow, dollars: string) {
    if (dollars.trim() === "") return;
    const floorDollars = Number(dollars);
    if (!Number.isFinite(floorDollars) || floorDollars < 0) {
      setError("Enter a valid floor price.");
      return;
    }
    setError("");
    startTransition(async () => {
      const res = await setOrgFloorPrice({
        orgId,
        productId: p.productId,
        productName: p.name,
        floorDollars,
        unit: p.unit ?? "",
      });
      if (!res.ok) {
        setError(res.error ?? "Could not save the floor.");
        return;
      }
      // Refresh the `floors` prop so the saved floor shows in the default
      // (configured-only) view instead of appearing to vanish.
      router.refresh();
    });
  }

  function reset(productId: string) {
    setError("");
    startTransition(async () => {
      const res = await resetOrgFloorPrice(orgId, productId);
      if (!res.ok) {
        setError(res.error ?? "Could not clear the floor.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <section className={`${cardClass} p-6`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-navy">
            Wholesale floor prices
          </h2>
          <p className="mt-1 text-xs text-navy/60">
            {active
              ? "This org is on the margin model — it earns the spread above these floors."
              : "Set floors here; they take effect when this org's model is set to Margin."}
          </p>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search catalog to add a floor…"
          className="h-10 w-72 rounded-2xl border border-beige-dark bg-white px-3.5 text-sm text-navy outline-none transition-all placeholder:text-navy/35 focus:border-navy focus:ring-2 focus:ring-navy/10"
        />
      </div>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="mt-4 overflow-x-auto">
        {visible.length === 0 ? (
          <p className="py-8 text-center text-sm text-navy/60">
            {search.trim()
              ? "No catalog products match."
              : "No floors set yet. Search the catalog above to add one."}
          </p>
        ) : (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className={theadClass}>
              <tr>
                <th className="py-2 pr-4 font-semibold">Product</th>
                <th className="py-2 pr-4 font-semibold text-right">Standard</th>
                <th className="py-2 pr-4 font-semibold text-right">Floor ($)</th>
                <th className="py-2 font-semibold" />
              </tr>
            </thead>
            <tbody className="divide-y divide-beige text-navy">
              {visible.map((p) => {
                const floorCents = floors[p.productId];
                const hasFloor = floorCents != null;
                return (
                  <tr key={p.productId}>
                    <td className="py-2 pr-4">
                      <span className="font-medium">{p.name}</span>
                      {p.strength && (
                        <span className="block text-xs text-navy/55">
                          {p.strength}
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-4 text-right tabular-nums text-navy/70">
                      {p.standardCents != null
                        ? formatCents(p.standardCents)
                        : "—"}
                    </td>
                    <td className="py-2 pr-4 text-right">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        aria-label={`Floor price for ${p.name}`}
                        defaultValue={
                          hasFloor ? (floorCents / 100).toFixed(2) : ""
                        }
                        onBlur={(e) => save(p, e.target.value)}
                        placeholder="0.00"
                        className="h-9 w-28 rounded-2xl border border-beige-dark bg-white px-3 text-right text-sm tabular-nums text-navy outline-none transition-all placeholder:text-navy/35 focus:border-navy focus:ring-2 focus:ring-navy/10"
                      />
                    </td>
                    <td className="py-2 text-right">
                      {hasFloor && (
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => reset(p.productId)}
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
        )}
      </div>
    </section>
  );
}
