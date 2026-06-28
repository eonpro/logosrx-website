/**
 * `fetch` with a hard timeout.
 *
 * A bare `fetch()` has no default timeout, so a slow or hung upstream can stall
 * a request until the platform's function timeout (then surface as a 504). This
 * wrapper aborts after `timeoutMs`, turning an indefinite hang into a prompt,
 * catchable rejection (`TimeoutError`) that callers already handle.
 *
 * NOTE: the abort cancels the *entire* operation, including streaming the
 * response body. Use this for request/response calls that are read in full
 * (JSON APIs, webhooks, small payloads). For long-lived body streams (e.g.
 * proxying a large file download) prefer a bespoke, generous timeout or none.
 */
const DEFAULT_TIMEOUT_MS = 8_000;

export async function fetchWithTimeout(
  input: string | URL | Request,
  init: RequestInit = {},
  opts: { timeoutMs?: number } = {},
): Promise<Response> {
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timeoutSignal = AbortSignal.timeout(timeoutMs);

  // Respect a caller-provided signal by combining it with our timeout, so
  // either can abort the request. `AbortSignal.any` is available on Node 20.3+.
  const signal =
    init.signal && typeof AbortSignal.any === "function"
      ? AbortSignal.any([init.signal, timeoutSignal])
      : (init.signal ?? timeoutSignal);

  return fetch(input, { ...init, signal });
}
