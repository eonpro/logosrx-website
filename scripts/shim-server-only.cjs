/**
 * Preload shim for repo scripts that exercise server-side modules outside
 * Next.js (e.g. scripts/verify-lifefile-stub.ts):
 *
 *   NODE_OPTIONS="--require ./scripts/shim-server-only.cjs" npx tsx <script>
 *
 * `server-only` throws when imported without the `react-server` module
 * condition — but running Node WITH that condition breaks packages that need
 * the standard React build (e.g. @react-pdf/renderer's reconciler). Rewiring
 * just the `server-only` specifier to an empty module gives scripts the
 * production-like default condition everywhere else.
 */
const Module = require("node:module");
const path = require("node:path");

const empty = path.join(__dirname, "shim-empty.cjs");
const original = Module._resolveFilename;

Module._resolveFilename = function patched(request, ...rest) {
  if (request === "server-only" || request === "client-only") {
    return empty;
  }
  return original.call(this, request, ...rest);
};
