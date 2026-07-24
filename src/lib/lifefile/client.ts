/**
 * LifeFile API client (`POST /order`).
 *
 * One set of pharmacy-level credentials (Basic auth + vendor/location/network
 * headers) serves every clinic — clinic billing attribution travels as
 * `order.practice.id` (must be a practice on this API network). Clinic
 * isolation is enforced upstream in the order service; this layer is
 * transport only.
 *
 * LifeFile returns HTTP 200 with `{ type: "success" | "error" }` — we branch
 * on the body's `type`, never on the status code alone. The full raw response
 * is returned to the caller for persistence on the order row; it is never
 * shown to clinics.
 *
 * `LIFEFILE_MODE=stub` (or missing credentials outside production) selects a
 * stub client so dev/preview never hits the live pharmacy.
 */

import { fetchWithTimeout } from "@/lib/http/fetch";
import { log } from "@/lib/observability/logger";
import type {
  LifeFileClient,
  LifeFileOrderPayload,
  LifeFileResponseBody,
  LifeFileSubmitResult,
} from "./types";

const SUBMIT_TIMEOUT_MS = 15_000;

export interface LifeFileConfig {
  baseUrl: string;
  username: string;
  password: string;
  vendorId: string;
  locationId: string;
  networkId: string;
}

export function readLifeFileConfig(
  env: NodeJS.ProcessEnv = process.env,
): LifeFileConfig | null {
  const baseUrl = env.LIFEFILE_API_BASE_URL?.trim();
  const username = env.LIFEFILE_API_USERNAME?.trim();
  const password = env.LIFEFILE_API_PASSWORD;
  const vendorId = env.LIFEFILE_VENDOR_ID?.trim();
  const locationId = env.LIFEFILE_LOCATION_ID?.trim();
  const networkId = env.LIFEFILE_NETWORK_ID?.trim();
  if (!baseUrl || !username || !password || !vendorId || !locationId || !networkId) {
    return null;
  }
  return { baseUrl, username, password, vendorId, locationId, networkId };
}

/**
 * Pull LifeFile's order id out of the success `data` blob. The reference
 * doesn't pin the exact shape, so accept the common variants and fall back to
 * null (the order service marks the order accepted-without-id for support
 * follow-up rather than failing a successfully forwarded order).
 */
export function extractLfOrderId(data: unknown): string | null {
  if (data == null) return null;
  if (typeof data === "string" || typeof data === "number") {
    const value = String(data).trim();
    return /^\d+$/.test(value) ? value : null;
  }
  if (typeof data === "object") {
    const record = data as Record<string, unknown>;
    for (const key of ["orderId", "lfOrderId", "id"]) {
      const found = extractLfOrderId(record[key]);
      if (found) return found;
    }
    if (record.order && typeof record.order === "object") {
      return extractLfOrderId(record.order);
    }
  }
  return null;
}

class HttpLifeFileClient implements LifeFileClient {
  constructor(private readonly config: LifeFileConfig) {}

  async submitOrder(
    payload: LifeFileOrderPayload,
  ): Promise<LifeFileSubmitResult> {
    const { config } = this;
    const url = `${config.baseUrl.replace(/\/$/, "")}/order`;
    const basic = Buffer.from(
      `${config.username}:${config.password}`,
    ).toString("base64");

    let response: Response;
    try {
      response = await fetchWithTimeout(
        url,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${basic}`,
            "X-Vendor-ID": config.vendorId,
            "X-Location-ID": config.locationId,
            "X-API-Network-ID": config.networkId,
          },
          body: JSON.stringify(payload),
        },
        { timeoutMs: SUBMIT_TIMEOUT_MS },
      );
    } catch (err) {
      log.error("lifefile submit transport failure", { error: err });
      return {
        ok: false,
        kind: "transport",
        message:
          err instanceof Error && err.name === "TimeoutError"
            ? "Pharmacy system timed out."
            : "Could not reach the pharmacy system.",
      };
    }

    let body: LifeFileResponseBody | null = null;
    let rawText: string | null = null;
    try {
      rawText = await response.text();
      body = JSON.parse(rawText) as LifeFileResponseBody;
    } catch {
      // Non-JSON body — handled below alongside missing `type`.
    }

    if (!body || (body.type !== "success" && body.type !== "error")) {
      log.error("lifefile submit unparseable response", {
        status: response.status,
        body: rawText?.slice(0, 2000),
      });
      return {
        ok: false,
        kind: "transport",
        message: `Unexpected pharmacy response (HTTP ${response.status}).`,
        raw: rawText?.slice(0, 10_000),
        httpStatus: response.status,
      };
    }

    if (body.type === "error" || !response.ok) {
      return {
        ok: false,
        kind: "rejected",
        message: body.message?.slice(0, 500) || "Pharmacy rejected the order.",
        raw: body,
        httpStatus: response.status,
      };
    }

    const lfOrderId = extractLfOrderId(body.data);
    if (!lfOrderId) {
      // Accepted but no id we can recognize — treat as accepted; support can
      // reconcile from the raw response + referenceId.
      log.warn("lifefile accepted order without a recognizable order id", {
        messageId: payload.message.id,
      });
    }
    return { ok: true, lfOrderId: lfOrderId ?? "", raw: body };
  }
}

/**
 * Stub client for dev/preview/tests. Accepts everything and returns a fake,
 * recognizable order id. Never touches the network.
 */
class StubLifeFileClient implements LifeFileClient {
  async submitOrder(
    payload: LifeFileOrderPayload,
  ): Promise<LifeFileSubmitResult> {
    const lfOrderId = `99${String(payload.message.id).padStart(6, "0")}`;
    log.info("lifefile stub accepted order", {
      messageId: payload.message.id,
      referenceId: payload.order.general?.referenceId,
      lfOrderId,
    });
    return {
      ok: true,
      lfOrderId,
      raw: { type: "success", message: "stub", data: { orderId: lfOrderId } },
    };
  }
}

export function isLifeFileStubMode(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  if (env.LIFEFILE_MODE === "stub") return true;
  if (env.LIFEFILE_MODE === "live") return false;
  // Unset mode: default to stub whenever credentials are absent so local dev
  // and previews work out of the box. In production, missing credentials are
  // a config error surfaced by the client, not silently stubbed.
  return readLifeFileConfig(env) === null && env.VERCEL_ENV !== "production";
}

class UnconfiguredLifeFileClient implements LifeFileClient {
  async submitOrder(): Promise<LifeFileSubmitResult> {
    return {
      ok: false,
      kind: "config",
      message: "LifeFile API is not configured. Order was not sent.",
    };
  }
}

export function getLifeFileClient(
  env: NodeJS.ProcessEnv = process.env,
): LifeFileClient {
  if (isLifeFileStubMode(env)) return new StubLifeFileClient();
  const config = readLifeFileConfig(env);
  if (!config) {
    log.error("lifefile client requested but credentials are missing");
    return new UnconfiguredLifeFileClient();
  }
  return new HttpLifeFileClient(config);
}
