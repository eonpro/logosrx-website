import { log } from "@/lib/observability/logger";

/**
 * Lightweight performance instrumentation — no external APM dependency.
 *
 * Two tools:
 *   - `timed(label, fn)`: measures any async op (typically a DB query) and
 *     emits a structured log line. Anything at/above `SLOW_OP_MS` logs at
 *     `warn` (so it surfaces in prod log search) with the duration; faster ops
 *     log at `debug` (dropped in prod by the logger's level gate). This gives
 *     "which query is slow" visibility for free in Vercel/Datadog logs.
 *   - `ServerTiming`: accumulates spans and renders a `Server-Timing` response
 *     header so durations show up in the browser DevTools Network → Timing tab
 *     for route handlers. Use it where a `Response` is returned (route
 *     handlers); RSC pages can't set per-response headers, so they use `timed`.
 *
 * Tune the slow threshold with `SLOW_OP_MS` (default 200ms).
 */
const SLOW_OP_MS = Number(process.env.SLOW_OP_MS ?? 200);

export async function timed<T>(
  label: string,
  fn: () => Promise<T>,
  fields?: Record<string, unknown>,
): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    const ms = Math.round(performance.now() - start);
    if (ms >= SLOW_OP_MS) {
      log.warn("slow op", { op: label, ms, ...fields });
    } else {
      log.debug("op", { op: label, ms, ...fields });
    }
  }
}

interface TimingMark {
  name: string;
  dur: number;
  desc?: string;
}

/** Accumulates spans for a single request and renders the `Server-Timing` header. */
export class ServerTiming {
  private marks: TimingMark[] = [];

  /** Record a pre-measured span (milliseconds). */
  add(name: string, dur: number, desc?: string): void {
    this.marks.push({ name, dur: Math.round(dur), desc });
  }

  /** Measure an async op, record it, and return its result. */
  async measure<T>(
    name: string,
    fn: () => Promise<T>,
    desc?: string,
  ): Promise<T> {
    const start = performance.now();
    try {
      return await fn();
    } finally {
      this.add(name, performance.now() - start, desc);
    }
  }

  /** Render the `Server-Timing` header value, e.g. `db;dur=12;desc="select 1"`. */
  toHeader(): string {
    return this.marks
      .map((m) => {
        const base = `${m.name};dur=${m.dur}`;
        return m.desc ? `${base};desc=${JSON.stringify(m.desc)}` : base;
      })
      .join(", ");
  }
}
