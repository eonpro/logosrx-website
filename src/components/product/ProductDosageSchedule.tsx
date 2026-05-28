import type {
  DosageScheduleColumn,
  DosageScheduleRow,
  Product,
} from "@/data/products";
import Reveal from "../Reveal";

const COLUMN_LABEL: Record<DosageScheduleColumn, string> = {
  weeks: "Weeks",
  units: "Units",
  mg: "MG",
  ml: "ML",
  directions: "SIG / Directions",
};

function getCell(row: DosageScheduleRow, key: DosageScheduleColumn): string {
  return row[key] ?? "—";
}

interface ProductDosageScheduleProps {
  product: Product;
}

export default function ProductDosageSchedule({
  product,
}: ProductDosageScheduleProps) {
  const schedule = product.dosageSchedule;
  if (!schedule || schedule.rows.length === 0 || schedule.columns.length === 0) {
    return null;
  }

  return (
    <section className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <Reveal>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-magenta mb-4">
            Typical dosage &amp; titration
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-navy leading-[1.15]">
            Recommended titration schedule
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-navy/65">
            Reference schedule only — your provider may adjust the timing or
            dose based on your individual response and lab work.
          </p>
        </Reveal>

        <Reveal delay={80} className="mt-10 overflow-hidden rounded-3xl border border-beige/70 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-beige bg-beige/40">
                  {schedule.columns.map((c) => (
                    <th
                      key={c}
                      scope="col"
                      className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-navy/70"
                    >
                      {COLUMN_LABEL[c]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {schedule.rows.map((row, i) => (
                  <tr
                    key={i}
                    className={`border-b border-beige/60 last:border-b-0 ${
                      i % 2 === 0 ? "bg-white" : "bg-cream/40"
                    }`}
                  >
                    {schedule.columns.map((c, j) => (
                      <td
                        key={`${i}-${c}`}
                        className={`px-6 py-5 text-sm text-navy/85 align-top ${
                          j === 0 ? "font-semibold text-navy whitespace-nowrap" : ""
                        } ${c === "directions" ? "min-w-[280px]" : ""}`}
                      >
                        {getCell(row, c)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>

        {schedule.note ? (
          <Reveal delay={160}>
            <p className="mt-5 text-xs italic text-navy/60 leading-relaxed max-w-3xl">
              {schedule.note}
            </p>
          </Reveal>
        ) : null}
      </div>
    </section>
  );
}
