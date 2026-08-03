import { describe, expect, it } from "vitest";
import { parseInvoiceCsv, parseMoneyToCents } from "./csv";

const HEADER =
  "Date Range,Date Written,Date Shipped,Ship to State,Patient Name,Practice Name,Drug Name,Rx Qty,Rx Status,Rx Price,Order ID";

describe("parseMoneyToCents", () => {
  it("parses plain and formatted amounts", () => {
    expect(parseMoneyToCents("80.00")).toBe(8_000);
    expect(parseMoneyToCents("$ 80.00")).toBe(8_000);
    expect(parseMoneyToCents("$1,234.56")).toBe(123_456);
    expect(parseMoneyToCents("80")).toBe(8_000);
  });

  it("returns NaN on garbage", () => {
    expect(parseMoneyToCents("abc")).toBeNaN();
    expect(parseMoneyToCents("12.345")).toBeNaN();
    expect(parseMoneyToCents("")).toBeNaN();
  });
});

describe("parseInvoiceCsv", () => {
  it("parses the LifeFile shipment report format", () => {
    const { rows, errors, totalCents, dateRange } = parseInvoiceCsv(
      [
        HEADER,
        '07/20/2026- 08/02/2026,7/21/26,7/22/26 10:14,NJ,"Scott, Amoya",OPENLOOP HEALTHCARE PARTNERS PC,TIRZEPATIDE/GLYCINE 10/20MG/ML(1MLVIAL) SOLUTION Injectable 10MG/20MG/ML,1,SHIPPED,$ 80.00,103533415',
        '07/20/2026- 08/02/2026,7/21/26,7/22/26 10:13,NJ,"McGinty, John",OPENLOOP HEALTHCARE PARTNERS PC,TIRZEPATIDE/GLYCINE 10/20MG/ML(1MLVIAL) SOLUTION Injectable 10MG/20MG/ML,1,SHIPPED,$ 80.00,103533489',
      ].join("\n"),
    );
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      dateWritten: "7/21/26",
      dateShipped: "7/22/26 10:14",
      shipToState: "NJ",
      patientName: "Scott, Amoya",
      practiceName: "OPENLOOP HEALTHCARE PARTNERS PC",
      rxQty: 1,
      rxStatus: "SHIPPED",
      rxPriceCents: 8_000,
      orderId: "103533415",
    });
    expect(totalCents).toBe(16_000);
    expect(dateRange).toBe("07/20/2026- 08/02/2026");
  });

  it("is case/spacing-insensitive on headers and tolerates blank optionals", () => {
    const { rows, errors, totalCents } = parseInvoiceCsv(
      [
        "patient name,DRUG NAME,rx price,order id",
        '"Doe, Jane",SEMAGLUTIDE 5MG/ML,125.50,555001',
        '"Roe, Rick",SEMAGLUTIDE 5MG/ML,,555002',
      ].join("\n"),
    );
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(2);
    expect(rows[0].dateWritten).toBeNull();
    expect(rows[1].rxPriceCents).toBeNull();
    expect(totalCents).toBe(12_550);
  });

  it("reports missing required columns", () => {
    const { rows, errors } = parseInvoiceCsv(
      ["date,notes", "2026-06-01,hello"].join("\n"),
    );
    expect(rows).toEqual([]);
    expect(errors[0]).toContain("Patient Name");
    expect(errors[0]).toContain("Drug Name");
    expect(errors[0]).toContain("Rx Price");
  });

  it("flags bad prices with line numbers and keeps good rows", () => {
    const { rows, errors, totalCents } = parseInvoiceCsv(
      [
        HEADER,
        ',,,NJ,"Doe, Jane",Practice,Drug A,1,SHIPPED,not-money,1001',
        ',,,NJ,"Roe, Rick",Practice,Drug B,1,SHIPPED,$40.00,1002',
      ].join("\n"),
    );
    expect(errors).toEqual(['Line 2: invalid Rx Price "not-money".']);
    expect(rows).toHaveLength(1);
    expect(totalCents).toBe(4_000);
  });

  it("skips blank/summary lines without identifying fields", () => {
    const { rows, errors } = parseInvoiceCsv(
      [
        HEADER,
        "",
        ',,,NJ,"Doe, Jane",Practice,Drug A,1,SHIPPED,$40.00,1001',
        ",,,,,,,,,,",
      ].join("\n"),
    );
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(1);
  });

  it("errors on empty input", () => {
    expect(parseInvoiceCsv("").errors).toEqual(["The file is empty."]);
    expect(parseInvoiceCsv(HEADER).errors).toEqual([
      "No transactions found in the file.",
    ]);
  });
});
