const { parseCuitLastDigit, getGrupoForDigit, computeVencimientoDate } = require("../domain/taxCalendar");
const { adjustToNextBusinessDayUTC } = require("../domain/businessDays");
const { IMPUESTOS } = require("../data/taxCalendar2026");

const iva = IMPUESTOS.find((i) => i.id === "iva");

describe("parseCuitLastDigit", () => {
  test("extracts the last digit ignoring dashes", () => {
    expect(parseCuitLastDigit("20-12345678-9")).toBe(9);
  });

  test("works without separators", () => {
    expect(parseCuitLastDigit("20123456780")).toBe(0);
  });

  test("returns 0 for null/empty", () => {
    expect(parseCuitLastDigit(null)).toBe(0);
    expect(parseCuitLastDigit("")).toBe(0);
  });

  test("returns 0 for non-numeric input", () => {
    expect(parseCuitLastDigit("abc")).toBe(0);
  });
});

describe("getGrupoForDigit", () => {
  test("selects the IVA group for digit 9 (baseDia 23)", () => {
    expect(getGrupoForDigit(iva, 9).baseDia).toBe(23);
  });

  test("selects the IVA group for digit 0 (baseDia 19)", () => {
    expect(getGrupoForDigit(iva, 0).baseDia).toBe(19);
  });

  test("falls back to the first group when no group matches", () => {
    const fake = { grupos: [{ digits: [1], baseDia: 5 }, { digits: [2], baseDia: 9 }] };
    expect(getGrupoForDigit(fake, 9).baseDia).toBe(5);
  });
});

describe("computeVencimientoDate", () => {
  test("composes group selection with the business-day adjustment", () => {
    const got = computeVencimientoDate(iva, 9, 2026, 4); // May 2026, digit 9 -> baseDia 23
    const expected = adjustToNextBusinessDayUTC(2026, 4, 23);
    expect(got.toISOString()).toBe(expected.toISOString());
  });
});
