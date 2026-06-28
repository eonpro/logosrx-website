/**
 * Fail-fast environment-variable validation.
 *
 * Instead of scattering `process.env.X!` non-null assertions across the
 * codebase (which surface as confusing runtime errors deep in a request), we
 * validate the critical configuration once at server boot via
 * `instrumentation.ts → register()`. Missing or malformed values abort the
 * boot in production with a single, actionable error listing every problem.
 *
 * Set `SKIP_ENV_VALIDATION=true` to bypass (used by CI `build`/`schema` jobs,
 * which compile without real infrastructure credentials).
 *
 * Dependency-free on purpose: this runs in the Node runtime at boot, before
 * the app is serving traffic, so we keep it tiny and self-contained.
 */

type Requirement = "always" | "production";

interface EnvRule {
  name: string;
  /** `always` = needed in every environment; `production` = only enforced in prod. */
  required: Requirement;
  /** Human-readable purpose, shown in the error so ops can fix it fast. */
  description: string;
  /** Optional format check. Return an error string when invalid, else null. */
  validate?: (value: string) => string | null;
}

/**
 * Never-required vars: only format-checked when present, so a typo'd URL or
 * non-numeric tuning knob is caught at boot instead of failing mid-request.
 */
interface OptionalRule {
  name: string;
  validate: (value: string) => string | null;
}

/**
 * Companion requirement: integrations configured by more than one var. When
 * `trigger` is set, `requires` must be too — a half-configured integration (a
 * URL with no token, a published catalog PDF with no gate token) is a bug in
 * every environment, so this is always enforced.
 */
interface EnvCompanion {
  trigger: string;
  requires: string;
  hint: string;
}

/** Variables that are only advisory — missing them degrades gracefully. */
interface EnvWarning {
  /** At least one of these must be set, or we warn. */
  anyOf: string[];
  message: string;
  /** Only warn in production (avoids dev/test noise for prod-only concerns). */
  prodOnly?: boolean;
}

// --- Shared format validators ---

function httpUrl(value: string): string | null {
  try {
    return /^https?:$/.test(new URL(value).protocol)
      ? null
      : "must be an http(s) URL";
  } catch {
    return "must be a valid URL";
  }
}

function httpsUrl(value: string): string | null {
  try {
    return new URL(value).protocol === "https:" ? null : "must be an https URL";
  } catch {
    return "must be a valid URL";
  }
}

function numeric(value: string): string | null {
  return /^\d+$/.test(value) ? null : "must be a number";
}

function logLevel(value: string): string | null {
  return ["debug", "info", "warn", "error"].includes(value.toLowerCase())
    ? null
    : "must be one of debug, info, warn, error";
}

function emailFrom(value: string): string | null {
  // Accept a bare address or RFC-5322 "Display Name <addr@host>".
  const match = value.match(/<([^>]+)>\s*$/);
  const addr = (match ? match[1] : value).trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)
    ? null
    : 'must be an email address or "Name <email>"';
}

function postgresUrl(value: string): string | null {
  return /^postgres(?:ql)?:\/\//.test(value)
    ? null
    : "must be a postgres:// connection string";
}

function isProduction(): boolean {
  return (
    process.env.NODE_ENV === "production" &&
    process.env.VERCEL_ENV !== "preview" &&
    process.env.VERCEL_ENV !== "development"
  );
}

const RULES: EnvRule[] = [
  // --- Database (RDS IAM auth) ---
  { name: "PGHOST", required: "production", description: "Postgres host (Aurora endpoint)" },
  { name: "PGUSER", required: "production", description: "Postgres IAM database user" },
  {
    name: "PGPORT",
    required: "production",
    description: "Postgres port",
    validate: (v) => (/^\d+$/.test(v) ? null : "must be a number"),
  },
  { name: "AWS_REGION", required: "production", description: "AWS region for RDS signer / SES" },
  {
    name: "AWS_ROLE_ARN",
    required: "production",
    description: "IAM role ARN assumed via Vercel OIDC for RDS auth",
    validate: (v) => (v.startsWith("arn:aws:iam::") ? null : "must be an IAM role ARN"),
  },

  // --- Auth (Clerk) ---
  {
    name: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    required: "always",
    description: "Clerk publishable key (client)",
    validate: (v) => (v.startsWith("pk_") ? null : "must start with pk_"),
  },
  {
    name: "CLERK_SECRET_KEY",
    required: "production",
    description: "Clerk secret key (server)",
    validate: (v) => (v.startsWith("sk_") ? null : "must start with sk_"),
  },

  // --- Crypto / cookie signing ---
  {
    name: "ONBOARDING_ENCRYPTION_KEY",
    required: "production",
    description: "Master secret for at-rest encryption + quote cookie signing",
    validate: (v) => (v.length >= 16 ? null : "must be at least 16 characters"),
  },
];

/** Format-only checks for optional configuration (validated iff present). */
const OPTIONAL_RULES: OptionalRule[] = [
  { name: "DATABASE_URL", validate: postgresUrl },
  { name: "NEXT_PUBLIC_SITE_URL", validate: httpUrl },
  { name: "KV_REST_API_URL", validate: httpsUrl },
  { name: "UPSTASH_REDIS_REST_URL", validate: httpsUrl },
  { name: "CATALOG_PDF_URL", validate: httpsUrl },
  { name: "SENTRY_DSN", validate: httpsUrl },
  { name: "NEXT_PUBLIC_SENTRY_DSN", validate: httpsUrl },
  { name: "EMAIL_FROM", validate: emailFrom },
  { name: "LOG_LEVEL", validate: logLevel },
  { name: "SLOW_OP_MS", validate: numeric },
];

const COMPANIONS: EnvCompanion[] = [
  {
    trigger: "KV_REST_API_URL",
    requires: "KV_REST_API_TOKEN",
    hint: "Vercel KV needs both the URL and token.",
  },
  {
    trigger: "UPSTASH_REDIS_REST_URL",
    requires: "UPSTASH_REDIS_REST_TOKEN",
    hint: "Upstash Redis needs both the URL and token.",
  },
  {
    trigger: "CATALOG_PDF_URL",
    requires: "CATALOG_DOWNLOAD_TOKEN",
    hint: "A published catalog PDF must be gated by a download token.",
  },
  {
    trigger: "CATALOG_DOWNLOAD_TOKEN",
    requires: "CATALOG_PDF_URL",
    hint: "A catalog download token is useless without the PDF URL.",
  },
  {
    trigger: "SES_ACCESS_KEY_ID",
    requires: "SES_SECRET_ACCESS_KEY",
    hint: "SES needs both the access key id and secret.",
  },
  {
    trigger: "SES_SECRET_ACCESS_KEY",
    requires: "SES_ACCESS_KEY_ID",
    hint: "SES needs both the access key id and secret.",
  },
];

const WARNINGS: EnvWarning[] = [
  {
    anyOf: [
      "KV_REST_API_URL",
      "UPSTASH_REDIS_REST_URL",
    ],
    message:
      "No Upstash/Vercel KV credentials set — rate limiting will use the " +
      "in-memory fallback (not shared across serverless instances).",
  },
  {
    anyOf: ["CATALOG_PDF_URL"],
    message:
      "CATALOG_PDF_URL / CATALOG_DOWNLOAD_TOKEN not set — the private " +
      "/download/catalog link will 404. Run `npm run catalog:upload` to " +
      "publish the PDF and print both values.",
  },
  {
    anyOf: ["SENTRY_DSN", "NEXT_PUBLIC_SENTRY_DSN"],
    prodOnly: true,
    message:
      "No Sentry DSN set in production — server and client errors won't be " +
      "reported.",
  },
  {
    anyOf: ["ADMIN_EMAILS", "ADMIN_VIEWER_EMAILS"],
    prodOnly: true,
    message:
      "No ADMIN_EMAILS / ADMIN_VIEWER_EMAILS set — no one can access the " +
      "/admin portal in production.",
  },
  {
    anyOf: ["SES_ACCESS_KEY_ID"],
    prodOnly: true,
    message:
      "SES credentials not set — transactional email (clinic approvals, " +
      "partner invites) is disabled in production.",
  },
];

export interface EnvValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

/** Pure validation pass — returns problems without throwing. Easy to unit test. */
export function checkEnv(
  env: NodeJS.ProcessEnv = process.env,
  prod = isProduction(),
): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const rule of RULES) {
    const value = env[rule.name];
    const enforced = rule.required === "always" || (rule.required === "production" && prod);

    if (!value) {
      if (enforced) {
        errors.push(`Missing ${rule.name} — ${rule.description}.`);
      } else if (!prod) {
        warnings.push(`${rule.name} not set (${rule.description}); using dev fallback.`);
      }
      continue;
    }

    const formatError = rule.validate?.(value);
    if (formatError) {
      errors.push(`Invalid ${rule.name}: ${formatError}.`);
    }
  }

  for (const rule of OPTIONAL_RULES) {
    const value = env[rule.name];
    if (!value) continue;
    const formatError = rule.validate(value);
    if (formatError) {
      errors.push(`Invalid ${rule.name}: ${formatError}.`);
    }
  }

  for (const companion of COMPANIONS) {
    if (env[companion.trigger] && !env[companion.requires]) {
      errors.push(
        `Missing ${companion.requires} — required when ${companion.trigger} ` +
          `is set. ${companion.hint}`,
      );
    }
  }

  for (const warn of WARNINGS) {
    if (warn.prodOnly && !prod) continue;
    if (!warn.anyOf.some((name) => env[name])) {
      warnings.push(warn.message);
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

/**
 * Validates the environment and aborts the process in production when required
 * configuration is missing or malformed. In non-production it only logs so the
 * dev/test workflow is never blocked. No-op when `SKIP_ENV_VALIDATION=true`.
 */
export function validateEnv(): void {
  if (process.env.SKIP_ENV_VALIDATION === "true") return;

  const prod = isProduction();
  const { ok, errors, warnings } = checkEnv(process.env, prod);

  for (const w of warnings) {
    console.warn(`[env] ${w}`);
  }

  if (ok) return;

  const summary =
    "[env] Environment validation failed:\n" +
    errors.map((e) => `  • ${e}`).join("\n");

  if (prod) {
    // Abort boot — a missing secret/credential is never safe to run past.
    throw new Error(summary);
  }
  console.error(summary);
}
