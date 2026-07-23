"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { setLifeFileMapping } from "../actions";
import {
  Badge,
  inputClass,
  selectClass,
  tableWrapClass,
  theadClass,
  rowClass,
} from "@/components/ui/portal";
import { isControlledSchedule } from "@/lib/lifefile/constants";

interface ProductRow {
  id: string;
  name: string;
  strength: string | null;
  form: string;
  active: boolean;
  lfProductId: number | null;
  scheduleCode: string | null;
  quantityUnits: string | null;
  defaultQuantity: string | null;
}

interface DraftRow {
  lfProductId: string;
  scheduleCode: string;
  quantityUnits: string;
  defaultQuantity: string;
}

const SCHEDULE_OPTIONS = [
  { value: "", label: "—" },
  { value: "L", label: "L (legend)" },
  { value: "O", label: "O (OTC)" },
  { value: "2", label: "2 (controlled)" },
  { value: "3", label: "3 (controlled)" },
  { value: "4", label: "4 (controlled)" },
  { value: "5", label: "5 (controlled)" },
];

function toDraft(p: ProductRow): DraftRow {
  return {
    lfProductId: p.lfProductId ? String(p.lfProductId) : "",
    scheduleCode: p.scheduleCode ?? "",
    quantityUnits: p.quantityUnits ?? "",
    defaultQuantity: p.defaultQuantity ?? "",
  };
}

export default function MappingTable({
  products,
}: {
  products: ProductRow[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [drafts, setDrafts] = useState<Record<string, DraftRow>>(() =>
    Object.fromEntries(products.map((p) => [p.id, toDraft(p)])),
  );
  const [savingId, setSavingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<"all" | "unmapped" | "mapped">("all");
  const [query, setQuery] = useState("");

  const stats = useMemo(() => {
    const activeRows = products.filter((p) => p.active);
    const mapped = activeRows.filter((p) => p.lfProductId != null);
    return { active: activeRows.length, mapped: mapped.length };
  }, [products]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return products.filter((p) => {
      if (filter === "unmapped" && p.lfProductId != null) return false;
      if (filter === "mapped" && p.lfProductId == null) return false;
      if (needle && !`${p.name} ${p.id}`.toLowerCase().includes(needle)) {
        return false;
      }
      return true;
    });
  }, [products, filter, query]);

  function updateDraft(id: string, patch: Partial<DraftRow>) {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  }

  function save(id: string) {
    const draft = drafts[id];
    setSavingId(id);
    setErrors((prev) => ({ ...prev, [id]: "" }));
    startTransition(async () => {
      const result = await setLifeFileMapping(id, {
        lfProductId: draft.lfProductId.trim()
          ? Number(draft.lfProductId)
          : null,
        scheduleCode: draft.scheduleCode || null,
        quantityUnits: draft.quantityUnits || null,
        defaultQuantity: draft.defaultQuantity || null,
      });
      setSavingId(null);
      if (!result.ok) {
        setErrors((prev) => ({
          ...prev,
          [id]: result.error ?? "Could not save.",
        }));
        return;
      }
      router.refresh();
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {(
            [
              ["all", "All"],
              ["unmapped", "Unmapped"],
              ["mapped", "Mapped"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                filter === value
                  ? "bg-plum text-white shadow-soft"
                  : "border border-beige bg-white text-navy/60 hover:border-navy/30"
              }`}
            >
              {label}
            </button>
          ))}
          <Badge tone={stats.mapped === stats.active ? "success" : "warning"}>
            {stats.mapped}/{stats.active} active SKUs mapped
          </Badge>
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search products…"
          aria-label="Search products"
          className={`${inputClass} max-w-xs`}
        />
      </div>

      <div className={tableWrapClass}>
        <table className="w-full text-sm">
          <thead className={theadClass}>
            <tr>
              <th className="px-5 py-3.5">Product</th>
              <th className="px-4 py-3.5">LifeFile ID</th>
              <th className="px-4 py-3.5">Schedule</th>
              <th className="hidden px-4 py-3.5 lg:table-cell">Units</th>
              <th className="hidden px-4 py-3.5 lg:table-cell">Default qty</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {visible.map((p) => {
              const draft = drafts[p.id];
              const controlled = isControlledSchedule(draft.scheduleCode);
              const orderable =
                p.active && draft.lfProductId.trim() !== "" && !controlled;
              return (
                <tr key={p.id} className={rowClass}>
                  <td className="max-w-[260px] px-5 py-3">
                    <p className="truncate font-semibold text-navy">
                      {p.name}
                      {!p.active && (
                        <span className="ml-2 text-xs font-normal text-navy/40">
                          (inactive)
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-navy/50">
                      {[p.strength, p.form].filter(Boolean).join(" · ")}
                    </p>
                    {errors[p.id] && (
                      <p className="mt-1 text-xs font-medium text-red-600">
                        {errors[p.id]}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      min={1}
                      value={draft.lfProductId}
                      onChange={(e) =>
                        updateDraft(p.id, { lfProductId: e.target.value })
                      }
                      placeholder="—"
                      aria-label={`LifeFile product id for ${p.name}`}
                      className={`${inputClass} w-32 px-3 py-2 text-sm`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={draft.scheduleCode}
                      onChange={(e) =>
                        updateDraft(p.id, { scheduleCode: e.target.value })
                      }
                      aria-label={`Schedule for ${p.name}`}
                      className={`${selectClass} w-32 px-3 py-2 text-sm`}
                    >
                      {SCHEDULE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <input
                      value={draft.quantityUnits}
                      onChange={(e) =>
                        updateDraft(p.id, { quantityUnits: e.target.value })
                      }
                      placeholder="e.g. ml"
                      aria-label={`Quantity units for ${p.name}`}
                      className={`${inputClass} w-24 px-3 py-2 text-sm`}
                    />
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    <input
                      value={draft.defaultQuantity}
                      onChange={(e) =>
                        updateDraft(p.id, { defaultQuantity: e.target.value })
                      }
                      placeholder="e.g. 1"
                      aria-label={`Default quantity for ${p.name}`}
                      className={`${inputClass} w-24 px-3 py-2 text-sm`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    {orderable ? (
                      <Badge tone="success">Orderable</Badge>
                    ) : controlled ? (
                      <Badge tone="danger">Controlled</Badge>
                    ) : (
                      <Badge tone="neutral">Portal only</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      disabled={pending && savingId === p.id}
                      onClick={() => save(p.id)}
                      className="rounded-full border border-beige-dark bg-white px-4 py-1.5 text-xs font-semibold text-navy transition-all hover:border-navy/40 disabled:opacity-50"
                    >
                      {pending && savingId === p.id ? "Saving…" : "Save"}
                    </button>
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
