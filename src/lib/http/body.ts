import type { NextRequest } from "next/server";

export type JsonBodyResult =
  | { ok: true; body: Record<string, unknown> | unknown[] }
  | { ok: false; status: 400 | 413; error: string };

/**
 * Reads and parses a JSON request body with a hard byte cap.
 *
 * The cap is enforced while streaming — not just via the `Content-Length`
 * header, which a client can omit or fake (`Number(missing) === NaN` made the
 * old `contentLength > MAX` check silently pass). Malformed JSON returns a
 * clean 400 instead of throwing into the route's catch-all 500.
 */
export async function readJsonBody(
  req: NextRequest,
  maxBytes: number,
  options: { allowArray?: boolean } = {},
): Promise<JsonBodyResult> {
  // Fast path: reject a declared-oversized body before reading anything.
  const declared = Number(req.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    return { ok: false, status: 413, error: "Payload too large" };
  }

  const reader = req.body?.getReader();
  if (!reader) return { ok: false, status: 400, error: "Missing request body" };

  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel().catch(() => {});
        return { ok: false, status: 413, error: "Payload too large" };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, status: 400, error: "Could not read request body" };
  }

  try {
    const text = Buffer.concat(chunks).toString("utf8");
    const parsed: unknown = JSON.parse(text);
    if (Array.isArray(parsed)) {
      if (!options.allowArray) {
        return { ok: false, status: 400, error: "Invalid submission" };
      }
      return { ok: true, body: parsed };
    }
    if (!parsed || typeof parsed !== "object") {
      return { ok: false, status: 400, error: "Invalid submission" };
    }
    return { ok: true, body: parsed as Record<string, unknown> };
  } catch {
    return { ok: false, status: 400, error: "Invalid JSON" };
  }
}
