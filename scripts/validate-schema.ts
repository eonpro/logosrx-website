/**
 * Schema monitoring against BUILT output.
 *
 *   npm run build && npm run schema:check
 *   # or: tsx scripts/validate-schema.ts
 *
 * Scans every prerendered page in `.next/server/app/**​/*.html`, extracts the
 * JSON-LD `<script type="application/ld+json">` blocks, parses them (catching
 * syntax errors), and runs the pure `validateDocuments` invariants over all the
 * schema on each page together (so `@id` cross-references and duplicate-node
 * checks work). Exits non-zero on any problem so it can gate CI/deploys.
 *
 * Why HTML instead of hitting Google's Rich Results API: there is no stable
 * free API, and this runs fully offline + deterministically in CI. The checks
 * encode the same required-property rules Rich Results enforces for the types
 * we emit.
 */

import { readFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { glob } from "glob";
import { validateDocuments, type SchemaProblem } from "../src/lib/seo/validate";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const BUILD_DIR = join(ROOT, ".next", "server", "app");

const SCRIPT_RE =
  /<script type="application\/ld\+json">([\s\S]*?)<\/script>/g;

interface FileResult {
  file: string;
  scriptCount: number;
  parseErrors: string[];
  problems: SchemaProblem[];
}

function extractJsonLd(html: string): { docs: unknown[]; parseErrors: string[] } {
  const docs: unknown[] = [];
  const parseErrors: string[] = [];
  for (const match of html.matchAll(SCRIPT_RE)) {
    const raw = match[1];
    try {
      docs.push(JSON.parse(raw));
    } catch (err) {
      parseErrors.push(err instanceof Error ? err.message : String(err));
    }
  }
  return { docs, parseErrors };
}

async function main() {
  if (!existsSync(BUILD_DIR)) {
    console.error(
      `No build output at ${relative(ROOT, BUILD_DIR)}. Run \`npm run build\` first.`,
    );
    process.exit(1);
  }

  const files = (await glob("**/*.html", { cwd: BUILD_DIR })).sort();
  if (files.length === 0) {
    console.error("No prerendered HTML found — did the build succeed?");
    process.exit(1);
  }

  const results: FileResult[] = [];
  let totalScripts = 0;

  for (const rel of files) {
    const html = readFileSync(join(BUILD_DIR, rel), "utf8");
    const { docs, parseErrors } = extractJsonLd(html);
    totalScripts += docs.length;
    const problems = parseErrors.length === 0 ? validateDocuments(docs) : [];
    results.push({ file: rel, scriptCount: docs.length, parseErrors, problems });
  }

  const failing = results.filter(
    (r) => r.parseErrors.length > 0 || r.problems.length > 0,
  );
  const pagesWithNoSchema = results.filter((r) => r.scriptCount === 0);

  console.log(
    `Scanned ${results.length} pages, ${totalScripts} JSON-LD block(s).\n`,
  );

  if (pagesWithNoSchema.length > 0) {
    console.log(`ℹ ${pagesWithNoSchema.length} page(s) emitted no JSON-LD:`);
    for (const r of pagesWithNoSchema) console.log(`   - ${r.file}`);
    console.log("");
  }

  if (failing.length === 0) {
    console.log("✓ All structured data passed validation.");
    return;
  }

  for (const r of failing) {
    console.log(`✗ ${r.file}`);
    for (const e of r.parseErrors) console.log(`   JSON parse error: ${e}`);
    for (const p of r.problems) {
      console.log(`   ${p.scope ? `[${p.scope}] ` : ""}${p.message}`);
    }
  }

  const problemCount = failing.reduce(
    (n, r) => n + r.parseErrors.length + r.problems.length,
    0,
  );
  console.log(
    `\n✗ ${problemCount} problem(s) across ${failing.length} page(s).`,
  );
  process.exit(1);
}

main().catch((err) => {
  console.error("Failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
