/**
 * Dependency-vulnerability gate for CI.
 *
 * Runs `npm audit --json` and fails the build when any advisory at or above the
 * configured threshold (default: "high") is present — EXCEPT advisories that are
 * explicitly accepted in `ALLOWLIST` below. Every allowlist entry must carry a
 * reason and a tracking note so deferrals are visible in code review and in the
 * CI log, never a silent ignore.
 *
 * Why a hand-rolled gate instead of `npm audit --audit-level=high`?
 *   - `npm audit` has no allowlist. A single unfixable transitive advisory would
 *     otherwise force the whole gate down to a weaker threshold or wedge CI red.
 *   - Pulling in a third-party audit tool (audit-ci, better-npm-audit) widens the
 *     very dependency surface we are trying to police. This stays in-repo,
 *     auditable, and zero-dependency.
 *
 * Usage:
 *   tsx scripts/audit-gate.ts            # gate at "high"
 *   AUDIT_LEVEL=critical tsx scripts/audit-gate.ts
 */

import { execFileSync } from "node:child_process";

type Severity = "info" | "low" | "moderate" | "high" | "critical";

const SEVERITY_RANK: Record<Severity, number> = {
  info: 0,
  low: 1,
  moderate: 2,
  high: 3,
  critical: 4,
};

/**
 * Advisories we have consciously reviewed and accepted for now. Keep this list
 * SHORT and JUSTIFIED. Prefer fixing (bump the dep) over allowlisting. Match by
 * GHSA id so a *new* advisory on the same package still trips the gate.
 *
 * Example shape:
 *   {
 *     ghsa: "GHSA-xxxx-xxxx-xxxx",
 *     package: "some-pkg",
 *     reason: "Dev-only tool; not reachable in production runtime.",
 *     until: "2026-09-01", // re-review date
 *   }
 */
interface AllowlistEntry {
  ghsa: string;
  package: string;
  reason: string;
  until: string;
}

const ALLOWLIST: AllowlistEntry[] = [];

interface AuditVia {
  source?: number;
  name?: string;
  title?: string;
  url?: string;
  severity?: Severity;
}

interface AuditVulnerability {
  name: string;
  severity: Severity;
  via: Array<string | AuditVia>;
}

interface AuditReport {
  vulnerabilities?: Record<string, AuditVulnerability>;
  metadata?: { vulnerabilities?: Record<string, number> };
}

function runNpmAudit(): AuditReport {
  let stdout = "";
  try {
    // `npm audit` exits non-zero when vulnerabilities are found; that is not a
    // tool failure, so capture stdout regardless of exit code.
    stdout = execFileSync("npm", ["audit", "--json"], {
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    });
  } catch (err) {
    const e = err as { stdout?: string };
    if (e.stdout) {
      stdout = e.stdout;
    } else {
      console.error("[audit-gate] failed to run `npm audit`:", err);
      process.exit(2);
    }
  }
  try {
    return JSON.parse(stdout) as AuditReport;
  } catch {
    console.error("[audit-gate] could not parse `npm audit --json` output.");
    process.exit(2);
  }
}

function ghsaFromUrl(url?: string): string | null {
  if (!url) return null;
  const id = url.split("/").pop() ?? "";
  return id.startsWith("GHSA-") ? id : null;
}

function main(): void {
  const threshold = (process.env.AUDIT_LEVEL as Severity) || "high";
  const minRank = SEVERITY_RANK[threshold] ?? SEVERITY_RANK.high;
  const allowed = new Set(ALLOWLIST.map((a) => a.ghsa));

  const report = runNpmAudit();
  const vulns = report.vulnerabilities ?? {};

  // Collect distinct advisories (the object-shaped `via` entries are the source
  // of truth; string entries just point at another vulnerable package).
  const advisories = new Map<string, { severity: Severity; pkg: string; title: string }>();
  for (const vuln of Object.values(vulns)) {
    for (const via of vuln.via) {
      if (typeof via !== "object") continue;
      const ghsa = ghsaFromUrl(via.url);
      if (!ghsa) continue;
      const severity = via.severity ?? vuln.severity;
      advisories.set(ghsa, {
        severity,
        pkg: via.name ?? vuln.name,
        title: via.title ?? "",
      });
    }
  }

  const blocking: Array<{ ghsa: string; severity: Severity; pkg: string; title: string }> = [];
  const accepted: string[] = [];
  for (const [ghsa, info] of advisories) {
    if (SEVERITY_RANK[info.severity] < minRank) continue;
    if (allowed.has(ghsa)) {
      accepted.push(`${ghsa} (${info.severity}, ${info.pkg})`);
      continue;
    }
    blocking.push({ ghsa, ...info });
  }

  const totals = report.metadata?.vulnerabilities ?? {};
  console.log(
    `[audit-gate] threshold=${threshold} · totals=${JSON.stringify(totals)} · ` +
      `allowlisted=${allowed.size}`,
  );

  if (accepted.length > 0) {
    console.log("[audit-gate] accepted (allowlisted) advisories:");
    for (const a of accepted) console.log(`  • ${a}`);
  }

  if (blocking.length === 0) {
    console.log(`[audit-gate] PASS — no un-accepted advisories at "${threshold}" or above.`);
    return;
  }

  blocking.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);
  console.error(
    `\n[audit-gate] FAIL — ${blocking.length} advisory(ies) at "${threshold}" or above:`,
  );
  for (const b of blocking) {
    console.error(`  • ${b.severity.toUpperCase()} ${b.ghsa} — ${b.pkg}: ${b.title}`);
  }
  console.error(
    "\nFix by upgrading the affected dependency (preferred). If genuinely " +
      "unfixable, add a justified, dated entry to ALLOWLIST in scripts/audit-gate.ts.",
  );
  process.exit(1);
}

main();
