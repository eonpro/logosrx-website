/**
 * Structured logger.
 *
 * Why not pull in `pino` or `winston`?
 *   - Vercel Functions already parse stdout as JSON when each line is JSON;
 *     a 30-line emitter gets us the same ingest pipeline without a runtime
 *     dependency.
 *   - Edge runtime can't load native `pino` because of `node:` builtins.
 *
 * Conventions:
 *   - One JSON object per line.
 *   - Stable keys: `ts`, `level`, `service`, `msg`, `env`, `release`,
 *     `runtime`, plus per-call `fields`.
 *   - Errors are serialized as `{ name, message, stack }` so log search
 *     can pivot on `error.message` without parsing free-form strings.
 *   - PII never goes through the logger — pass IDs, not bodies.
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const minLevel = (() => {
  const env = process.env.LOG_LEVEL?.toLowerCase() as LogLevel | undefined;
  if (env && env in LEVELS) return LEVELS[env];
  return process.env.NODE_ENV === "production" ? LEVELS.info : LEVELS.debug;
})();

const baseFields = {
  service: "logos-website",
  env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development",
  release:
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  region: process.env.VERCEL_REGION,
  runtime: process.env.NEXT_RUNTIME ?? "nodejs",
};

interface Fields {
  [key: string]: unknown;
  error?: unknown;
}

function serializeError(err: unknown) {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
    };
  }
  return err;
}

function emit(level: LogLevel, msg: string, fields?: Fields) {
  if (LEVELS[level] < minLevel) return;

  const payload: Record<string, unknown> = {
    ts: new Date().toISOString(),
    level,
    msg,
    ...baseFields,
  };

  if (fields) {
    for (const [key, value] of Object.entries(fields)) {
      payload[key] = key === "error" ? serializeError(value) : value;
    }
  }

  // Route through the matching console method so log aggregators (Vercel
  // Logs, Datadog, CloudWatch) tag the severity correctly.
  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const log = {
  debug(msg: string, fields?: Fields) {
    emit("debug", msg, fields);
  },
  info(msg: string, fields?: Fields) {
    emit("info", msg, fields);
  },
  warn(msg: string, fields?: Fields) {
    emit("warn", msg, fields);
  },
  error(msg: string, fields?: Fields) {
    emit("error", msg, fields);
  },
};
