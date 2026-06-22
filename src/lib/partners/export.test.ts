import { describe, expect, it } from "vitest";
import { centsToDollarString, toCsv } from "./export";

describe("toCsv", () => {
  it("builds a header + rows with CRLF line endings", () => {
    const csv = toCsv(["A", "B"], [["1", "2"], ["3", "4"]]);
    expect(csv).toBe("A,B\r\n1,2\r\n3,4\r\n");
  });

  it("quotes fields containing commas, quotes, or newlines", () => {
    const csv = toCsv(
      ["Name", "Note"],
      [["Acme, Inc", 'He said "hi"'], ["multi\nline", "ok"]],
    );
    expect(csv).toContain('"Acme, Inc"');
    expect(csv).toContain('"He said ""hi"""');
    expect(csv).toContain('"multi\nline"');
  });

  it("renders null/undefined as empty fields", () => {
    expect(toCsv(["A", "B"], [[null, undefined]])).toBe("A,B\r\n,\r\n");
  });
});

describe("centsToDollarString", () => {
  it("formats integer cents as plain dollars", () => {
    expect(centsToDollarString(123456)).toBe("1234.56");
    expect(centsToDollarString(0)).toBe("0.00");
    expect(centsToDollarString(5)).toBe("0.05");
  });
});
