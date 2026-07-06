import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { rateLimit } from "@/lib/security/rate-limit";
import { readJsonBody } from "@/lib/http/body";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Reporting-API batches are small; anything bigger is abuse, not a browser.
const MAX_REPORT_BYTES = 64 * 1024;

/**
 * CSP violation report sink.
 *
 * Two payload shapes need to be handled because browsers are in the middle
 * of migrating from `Content-Security-Policy: report-uri` to the
 * Reporting API (`Reporting-Endpoints` + `report-to`):
 *
 *   - Legacy `report-uri`: a single `application/csp-report` object with a
 *     top-level `"csp-report"` key.
 *   - Reporting API: an `application/reports+json` array of `Report`
 *     objects whose `body` mirrors the legacy shape.
 *
 * Reports are rate-limited internally (we cap how often we forward each
 * unique violation to Sentry) so a misconfigured directive doesn't blow up
 * the error quota. The raw report is dropped after forwarding — no PII
 * touches durable storage.
 */

interface CspReportBody {
  "document-uri"?: string;
  documentURL?: string;
  "violated-directive"?: string;
  effectiveDirective?: string;
  "effective-directive"?: string;
  "blocked-uri"?: string;
  blockedURL?: string;
  "source-file"?: string;
  sourceFile?: string;
  "line-number"?: number;
  lineNumber?: number;
  "column-number"?: number;
  columnNumber?: number;
  disposition?: "enforce" | "report";
  referrer?: string;
}

interface ReportingApiEntry {
  type?: string;
  age?: number;
  url?: string;
  user_agent?: string;
  body?: CspReportBody;
}

/**
 * Coalesce repeated violations within a window so one runaway directive
 * doesn't generate thousands of Sentry events. Keyed by (directive,
 * blockedUri, sourceFile). Lives per server instance — good enough since
 * the worst case is N copies for N warm instances.
 */
const SEEN_WINDOW_MS = 60 * 1000;
const seen = new Map<string, number>();

function shouldForward(key: string): boolean {
  const now = Date.now();
  const last = seen.get(key);
  if (last && now - last < SEEN_WINDOW_MS) return false;
  seen.set(key, now);
  // Trim the map opportunistically so it doesn't grow unbounded.
  if (seen.size > 1024) {
    for (const [k, ts] of seen) {
      if (now - ts > SEEN_WINDOW_MS) seen.delete(k);
    }
  }
  return true;
}

function normalize(report: CspReportBody | undefined) {
  if (!report) return null;
  const directive =
    report["violated-directive"] ??
    report["effective-directive"] ??
    report.effectiveDirective ??
    "unknown";
  const blocked = report["blocked-uri"] ?? report.blockedURL ?? "unknown";
  const source = report["source-file"] ?? report.sourceFile ?? "";
  const documentUri = report["document-uri"] ?? report.documentURL ?? "";
  return { directive, blocked, source, documentUri, raw: report };
}

export async function POST(req: NextRequest) {
  // Unauthenticated public sink: throttle per client so a bot can't burn CPU
  // or Sentry quota by spraying synthetic reports. Always 204 — report
  // senders never retry usefully and get no signal either way.
  const limit = await rateLimit("report", req);
  if (!limit.success) return new NextResponse(null, { status: 204 });

  const read = await readJsonBody(req, MAX_REPORT_BYTES, { allowArray: true });
  if (!read.ok) {
    // Browsers occasionally send empty bodies on tabs that close before the
    // report flushes. Acknowledge with 204 so they don't retry.
    return new NextResponse(null, { status: 204 });
  }
  const payload: unknown = read.body;

  const reports: Array<ReturnType<typeof normalize>> = [];

  // Reporting API shape: an array of entries.
  if (Array.isArray(payload)) {
    for (const entry of payload as ReportingApiEntry[]) {
      if (entry.type && entry.type !== "csp-violation") continue;
      const n = normalize(entry.body);
      if (n) reports.push(n);
    }
  } else if (payload && typeof payload === "object") {
    // Legacy report-uri shape: { "csp-report": {...} }.
    const legacy = (payload as { "csp-report"?: CspReportBody })["csp-report"];
    const n = normalize(legacy);
    if (n) reports.push(n);
  }

  for (const r of reports) {
    if (!r) continue;
    const key = `${r.directive}|${r.blocked}|${r.source}`;
    if (!shouldForward(key)) continue;

    Sentry.captureMessage(`CSP violation: ${r.directive}`, {
      level: "warning",
      tags: {
        feature: "csp",
        directive: r.directive,
      },
      extra: {
        blocked: r.blocked,
        source: r.source,
        documentUri: r.documentUri,
      },
    });
  }

  return new NextResponse(null, { status: 204 });
}

/**
 * Browsers send a CORS preflight when posting `application/reports+json`
 * cross-origin. We only ever accept reports from our own origin, but the
 * preflight needs an explicit 204 to succeed.
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Allow": "POST, OPTIONS",
    },
  });
}
