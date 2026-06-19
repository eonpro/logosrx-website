import { describe, expect, it } from "vitest";
import { parseDollarsToCents, parseTransactionsCsv } from "./csv";

describe("parseDollarsToCents", () => {
  it("parses plain and formatted dollar amounts", () => {
    expect(parseDollarsToCents("1234.56")).toBe(123_456);
    expect(parseDollarsToCents("$1,234.56")).toBe(123_456);
    expect(parseDollarsToCents("1234")).toBe(123_400);
    expect(parseDollarsToCents("0.5")).toBe(50);
  });

  it("returns NaN on garbage", () => {
    expect(parseDollarsToCents("abc")).toBeNaN();
    expect(parseDollarsToCents("12.345")).toBeNaN();
    expect(parseDollarsToCents("")).toBeNaN();
  });
});

describe("parseTransactionsCsv", () => {
  it("parses rows keyed by clinic id", () => {
    const { rows, errors } = parseTransactionsCsv(
      [
        "clinic_id,date,amount,description,reference",
        "42,2026-06-01,1250.00,June order,LF-10293",
        "7,2026-06-02,300,,",
      ].join("\n"),
    );
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      clinicId: 42,
      clinicEmail: null,
      revenueCents: 125_000,
      description: "June order",
      reference: "LF-10293",
    });
    expect(rows[0].date.getUTCFullYear()).toBe(2026);
    expect(rows[1]).toMatchObject({
      clinicId: 7,
      revenueCents: 30_000,
      description: null,
      reference: null,
    });
  });

  it("parses rows keyed by clinic email", () => {
    const { rows, errors } = parseTransactionsCsv(
      [
        "clinic_email,date,amount",
        "Clinic@Example.com,2026-05-15,300",
      ].join("\n"),
    );
    expect(errors).toEqual([]);
    expect(rows[0]).toMatchObject({
      clinicId: null,
      clinicEmail: "clinic@example.com",
      revenueCents: 30_000,
    });
  });

  it("handles quoted fields containing commas", () => {
    const { rows, errors } = parseTransactionsCsv(
      [
        "clinic_id,date,amount,description",
        '42,2026-06-01,"1,250.00","Semaglutide, 3 vials"',
      ].join("\n"),
    );
    expect(errors).toEqual([]);
    expect(rows[0].revenueCents).toBe(125_000);
    expect(rows[0].description).toBe("Semaglutide, 3 vials");
  });

  it("accepts 'revenue' as an alias for the amount column", () => {
    const { rows } = parseTransactionsCsv(
      ["clinic_id,date,revenue", "1,2026-01-02,99.99"].join("\n"),
    );
    expect(rows[0].revenueCents).toBe(9_999);
  });

  it("reports rows with bad dates or amounts without dropping good rows", () => {
    const { rows, errors } = parseTransactionsCsv(
      [
        "clinic_id,date,amount",
        "1,not-a-date,100",
        "2,2026-06-01,not-money",
        "3,2026-06-01,100",
        ",2026-06-01,100",
      ].join("\n"),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].clinicId).toBe(3);
    expect(errors).toHaveLength(3);
    expect(errors[0]).toMatch(/Line 2/);
    expect(errors[1]).toMatch(/Line 3/);
    expect(errors[2]).toMatch(/Line 5/);
  });

  it("rejects files without a usable header", () => {
    expect(parseTransactionsCsv("").errors).toContain("The file is empty.");
    expect(
      parseTransactionsCsv("foo,bar\n1,2").errors[0],
    ).toMatch(/clinic_id/);
    expect(
      parseTransactionsCsv("clinic_id,foo\n1,2").errors[0],
    ).toMatch(/date.*amount/);
  });

  it("skips blank lines", () => {
    const { rows, errors } = parseTransactionsCsv(
      ["clinic_id,date,amount", "", "5,2026-06-01,10", ""].join("\n"),
    );
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(1);
  });
});
