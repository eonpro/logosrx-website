/**
 * Structured-data validator — the "schema monitoring" gate.
 *
 * Pure functions that check the JSON-LD we actually emit against the invariants
 * Google's Rich Results + AI extractors care about: required properties per
 * `@type`, well-formed FAQ/Breadcrumb shapes, and `@id` cross-references that
 * actually resolve. Kept dependency-free and pure so it's unit-tested here AND
 * reused by `scripts/validate-schema.ts` against built HTML (offline, CI-able).
 *
 * This complements the builder unit tests: builders prove a node is shaped
 * right in isolation; this proves the COMPOSED, rendered graph on a page is
 * valid (catches wiring bugs like duplicate breadcrumbs or dangling @id refs).
 */

import { ENTITY_IDS } from "@/lib/seo/schema";

export interface SchemaProblem {
  /** The `@type` (or context) the problem relates to, when known. */
  scope?: string;
  message: string;
}

/** Sitewide entity ids defined once in the root layout's graph. References to
 * these are always valid even when validating a single page's scripts. */
const GLOBAL_IDS = new Set<string>(Object.values(ENTITY_IDS));

type Node = Record<string, unknown>;

function isObject(v: unknown): v is Node {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Normalize `@type` (string | string[]) to a string[]. */
function typesOf(node: Node): string[] {
  const t = node["@type"];
  if (typeof t === "string") return [t];
  if (Array.isArray(t)) return t.filter((x): x is string => typeof x === "string");
  return [];
}

/** Flatten a doc (graph or bare node) into its constituent nodes. */
export function nodesOf(doc: unknown): Node[] {
  if (!isObject(doc)) return [];
  const graph = doc["@graph"];
  if (Array.isArray(graph)) return graph.filter(isObject);
  return [doc];
}

function has(node: Node, key: string): boolean {
  const v = node[key];
  if (v === undefined || v === null) return false;
  if (typeof v === "string") return v.trim().length > 0;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

function requireKeys(node: Node, keys: string[], scope: string): SchemaProblem[] {
  return keys
    .filter((k) => !has(node, k))
    .map((k) => ({ scope, message: `${scope} missing required property "${k}"` }));
}

/** Per-type required-property + shape checks for a single node. */
function validateNode(node: Node): SchemaProblem[] {
  const types = typesOf(node);
  const problems: SchemaProblem[] = [];

  if (types.length === 0) {
    // Pure reference objects ({ "@id": ... }) are validated separately.
    if (!has(node, "@id")) {
      problems.push({ message: "Node has no @type" });
    }
    return problems;
  }

  const scope = types.join("+");

  if (types.includes("Organization")) {
    problems.push(...requireKeys(node, ["name", "url"], "Organization"));
  }
  if (types.includes("WebSite")) {
    problems.push(...requireKeys(node, ["name", "url"], "WebSite"));
  }
  if (types.some((t) => ["Pharmacy", "LocalBusiness", "MedicalBusiness"].includes(t))) {
    problems.push(...requireKeys(node, ["name", "address", "telephone"], scope));
  }
  if (types.includes("MedicalWebPage")) {
    problems.push(
      ...requireKeys(
        node,
        ["name", "description", "url", "isPartOf", "publisher", "inLanguage"],
        "MedicalWebPage",
      ),
    );
  }
  if (types.includes("Article")) {
    problems.push(
      ...requireKeys(node, ["headline", "url", "publisher", "author"], "Article"),
    );
  }
  if (types.includes("Service")) {
    problems.push(...requireKeys(node, ["name", "provider"], "Service"));
  }
  if (types.includes("DefinedTerm")) {
    problems.push(...requireKeys(node, ["name", "description"], "DefinedTerm"));
  }
  if (types.includes("DefinedTermSet")) {
    problems.push(...requireKeys(node, ["name"], "DefinedTermSet"));
  }
  if (types.includes("MedicalCondition")) {
    problems.push(...requireKeys(node, ["name"], "MedicalCondition"));
  }

  if (types.includes("FAQPage")) {
    problems.push(...validateFaqPage(node));
  }
  if (types.includes("BreadcrumbList")) {
    problems.push(...validateBreadcrumb(node));
  }

  return problems;
}

function validateFaqPage(node: Node): SchemaProblem[] {
  const problems: SchemaProblem[] = [];
  const main = node.mainEntity;
  if (!Array.isArray(main) || main.length === 0) {
    problems.push({ scope: "FAQPage", message: "FAQPage.mainEntity is empty" });
    return problems;
  }
  main.forEach((q, i) => {
    if (!isObject(q)) {
      problems.push({ scope: "FAQPage", message: `Question[${i}] is not an object` });
      return;
    }
    if (!has(q, "name")) {
      problems.push({ scope: "FAQPage", message: `Question[${i}] missing "name"` });
    }
    const ans = q.acceptedAnswer;
    if (!isObject(ans) || !has(ans, "text")) {
      problems.push({
        scope: "FAQPage",
        message: `Question[${i}] missing acceptedAnswer.text`,
      });
    }
  });
  return problems;
}

function validateBreadcrumb(node: Node): SchemaProblem[] {
  const problems: SchemaProblem[] = [];
  const items = node.itemListElement;
  if (!Array.isArray(items) || items.length === 0) {
    problems.push({
      scope: "BreadcrumbList",
      message: "BreadcrumbList.itemListElement is empty",
    });
    return problems;
  }
  items.forEach((it, i) => {
    if (!isObject(it)) {
      problems.push({ scope: "BreadcrumbList", message: `ListItem[${i}] not an object` });
      return;
    }
    if (it.position !== i + 1) {
      problems.push({
        scope: "BreadcrumbList",
        message: `ListItem[${i}] position ${String(it.position)} is not sequential (expected ${i + 1})`,
      });
    }
    if (!has(it, "name")) {
      problems.push({ scope: "BreadcrumbList", message: `ListItem[${i}] missing "name"` });
    }
    if (!has(it, "item")) {
      problems.push({ scope: "BreadcrumbList", message: `ListItem[${i}] missing "item"` });
    }
  });
  return problems;
}

/** Collect every `@id` that is DEFINED (a node carrying both @type and @id). */
function collectDefinedIds(nodes: Node[]): Set<string> {
  const ids = new Set<string>();
  for (const n of nodes) {
    const id = n["@id"];
    if (typeof id === "string" && typesOf(n).length > 0) ids.add(id);
  }
  return ids;
}

/** Walk a value tree, collecting reference-only objects ({ "@id" } with no @type). */
function collectReferences(value: unknown, out: string[]): void {
  if (Array.isArray(value)) {
    for (const v of value) collectReferences(v, out);
    return;
  }
  if (!isObject(value)) return;
  const keys = Object.keys(value);
  const id = value["@id"];
  if (typeof id === "string" && !value["@type"] && keys.length === 1) {
    out.push(id);
    return;
  }
  for (const k of keys) collectReferences(value[k], out);
}

/**
 * Validate all JSON-LD documents found on a single page together. Cross-page
 * globals (Organization/WebSite/Pharmacy from the layout) are always allowed as
 * reference targets via `opts.knownIds` (defaults to the sitewide entity ids).
 */
export function validateDocuments(
  docs: unknown[],
  opts?: { knownIds?: Iterable<string> },
): SchemaProblem[] {
  const problems: SchemaProblem[] = [];
  const allNodes: Node[] = [];

  for (const doc of docs) {
    if (isObject(doc) && Array.isArray(doc["@graph"])) {
      if (doc["@context"] !== "https://schema.org") {
        problems.push({
          scope: "@graph",
          message: `graph @context is "${String(doc["@context"])}" (expected "https://schema.org")`,
        });
      }
    }
    allNodes.push(...nodesOf(doc));
  }

  for (const node of allNodes) problems.push(...validateNode(node));

  // Cross-reference resolution.
  const known = new Set<string>([
    ...GLOBAL_IDS,
    ...(opts?.knownIds ?? []),
    ...collectDefinedIds(allNodes),
  ]);
  const refs: string[] = [];
  for (const node of allNodes) collectReferences(node, refs);
  for (const ref of refs) {
    if (!known.has(ref)) {
      problems.push({ message: `Dangling @id reference: "${ref}" is never defined` });
    }
  }

  // Duplicate-singleton checks (these should appear at most once per page).
  for (const singletonType of ["BreadcrumbList", "FAQPage"]) {
    const count = allNodes.filter((n) => typesOf(n).includes(singletonType)).length;
    if (count > 1) {
      problems.push({
        scope: singletonType,
        message: `${count} ${singletonType} nodes on one page (expected at most 1) — likely duplicate schema`,
      });
    }
  }

  return problems;
}
