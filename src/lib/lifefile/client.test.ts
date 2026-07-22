import { afterEach, describe, expect, it, vi } from "vitest";

import {
  extractLfOrderId,
  getLifeFileClient,
  isLifeFileStubMode,
  readLifeFileConfig,
} from "./client";
import { buildLifeFileOrderPayload } from "./payload";
import type { BuildOrderInput } from "./payload";

const FULL_ENV = {
  LIFEFILE_API_BASE_URL: "https://host47a.example.net:10165/lfapi/v1",
  LIFEFILE_API_USERNAME: "api-user",
  LIFEFILE_API_PASSWORD: "secret",
  LIFEFILE_VENDOR_ID: "11596",
  LIFEFILE_LOCATION_ID: "110396",
  LIFEFILE_NETWORK_ID: "1949",
} as unknown as NodeJS.ProcessEnv;

function samplePayload() {
  const input: BuildOrderInput = {
    messageId: 7,
    referenceId: "LGS-TEST-0007",
    payorType: "doc",
    prescriber: { npi: "1003802901", firstName: "J", lastName: "D" },
    patient: {
      firstName: "Pat",
      lastName: "Example",
      gender: "f",
      dateOfBirth: "1990-01-02",
    },
    shipping: {
      recipientType: "patient",
      recipientFirstName: "Pat",
      recipientLastName: "Example",
      addressLine1: "1 Main St",
      city: "Miami",
      state: "FL",
      zipCode: "33101",
    },
    rxs: [
      {
        lfProductId: 1,
        drugName: "Test Drug",
        directions: "Take as directed.",
        dateWritten: "2026-01-15",
      },
    ],
    now: new Date("2026-07-22T12:00:00.000Z"),
  };
  return buildLifeFileOrderPayload(input);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("readLifeFileConfig", () => {
  it("returns null when any credential is missing", () => {
    expect(readLifeFileConfig({} as unknown as NodeJS.ProcessEnv)).toBeNull();
    expect(
      readLifeFileConfig({
        ...FULL_ENV,
        LIFEFILE_API_PASSWORD: undefined,
      } as unknown as NodeJS.ProcessEnv),
    ).toBeNull();
  });

  it("returns the full config when everything is set", () => {
    expect(readLifeFileConfig(FULL_ENV)).toMatchObject({
      vendorId: "11596",
      locationId: "110396",
      networkId: "1949",
    });
  });
});

describe("isLifeFileStubMode", () => {
  it("honors explicit LIFEFILE_MODE", () => {
    expect(isLifeFileStubMode({ LIFEFILE_MODE: "stub" } as unknown as NodeJS.ProcessEnv)).toBe(true);
    expect(
      isLifeFileStubMode({ ...FULL_ENV, LIFEFILE_MODE: "live" } as unknown as NodeJS.ProcessEnv),
    ).toBe(false);
  });

  it("defaults to stub when credentials are missing outside production", () => {
    expect(isLifeFileStubMode({} as unknown as NodeJS.ProcessEnv)).toBe(true);
  });

  it("does not silently stub in production when credentials are missing", () => {
    expect(
      isLifeFileStubMode({ VERCEL_ENV: "production" } as unknown as NodeJS.ProcessEnv),
    ).toBe(false);
  });

  it("defaults to live when credentials exist", () => {
    expect(isLifeFileStubMode(FULL_ENV)).toBe(false);
  });
});

describe("extractLfOrderId", () => {
  it.each([
    [{ orderId: "24201108" }, "24201108"],
    [{ orderId: 24201108 }, "24201108"],
    [{ id: "24201108" }, "24201108"],
    [{ order: { id: 24201108 } }, "24201108"],
    ["24201108", "24201108"],
    [24201108, "24201108"],
  ])("extracts from %j", (data, expected) => {
    expect(extractLfOrderId(data)).toBe(expected);
  });

  it("returns null for unrecognizable shapes", () => {
    expect(extractLfOrderId(null)).toBeNull();
    expect(extractLfOrderId({})).toBeNull();
    expect(extractLfOrderId({ status: "ok" })).toBeNull();
    expect(extractLfOrderId("not-a-number")).toBeNull();
  });
});

describe("stub client", () => {
  it("accepts orders and returns a deterministic fake id", async () => {
    const client = getLifeFileClient({ LIFEFILE_MODE: "stub" } as unknown as NodeJS.ProcessEnv);
    const result = await client.submitOrder(samplePayload());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.lfOrderId).toBe("99000007");
    }
  });
});

describe("unconfigured client", () => {
  it("returns a config error without touching the network", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const client = getLifeFileClient({
      LIFEFILE_MODE: "live",
    } as unknown as NodeJS.ProcessEnv);
    const result = await client.submitOrder(samplePayload());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.kind).toBe("config");
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe("http client", () => {
  function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }

  it("sends Basic auth + LifeFile headers to <base>/order", async () => {
    const fetchSpy = vi.fn(async () =>
      jsonResponse({ type: "success", data: { orderId: "24201108" } }),
    );
    vi.stubGlobal("fetch", fetchSpy);

    const client = getLifeFileClient(FULL_ENV);
    const result = await client.submitOrder(samplePayload());

    expect(result.ok).toBe(true);
    if (result.ok) expect(result.lfOrderId).toBe("24201108");

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://host47a.example.net:10165/lfapi/v1/order");
    const headers = init.headers as Record<string, string>;
    expect(headers["X-Vendor-ID"]).toBe("11596");
    expect(headers["X-Location-ID"]).toBe("110396");
    expect(headers["X-API-Network-ID"]).toBe("1949");
    expect(headers.Authorization).toBe(
      `Basic ${Buffer.from("api-user:secret").toString("base64")}`,
    );
  });

  it("treats type:error as a pharmacy rejection even on HTTP 200", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({ type: "error", message: "Drug not found." }),
      ),
    );

    const client = getLifeFileClient(FULL_ENV);
    const result = await client.submitOrder(samplePayload());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.kind).toBe("rejected");
      expect(result.message).toBe("Drug not found.");
    }
  });

  it("treats unparseable bodies as transport errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("<html>gateway</html>", { status: 502 })),
    );

    const client = getLifeFileClient(FULL_ENV);
    const result = await client.submitOrder(samplePayload());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.kind).toBe("transport");
      expect(result.httpStatus).toBe(502);
    }
  });

  it("treats network failures as transport errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new TypeError("fetch failed");
      }),
    );

    const client = getLifeFileClient(FULL_ENV);
    const result = await client.submitOrder(samplePayload());
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.kind).toBe("transport");
  });

  it("accepts success responses without a recognizable order id", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ type: "success", data: {} })),
    );

    const client = getLifeFileClient(FULL_ENV);
    const result = await client.submitOrder(samplePayload());
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.lfOrderId).toBe("");
  });
});
