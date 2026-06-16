const { adjustToNextBusinessDayUTC } = require("../domain/businessDays");

describe("adjustToNextBusinessDayUTC", () => {
  test("a weekday is returned unchanged at 12:00 UTC", () => {
    // 2026-01-01 is a Thursday
    const d = adjustToNextBusinessDayUTC(2026, 0, 1);
    expect(d.getUTCFullYear()).toBe(2026);
    expect(d.getUTCMonth()).toBe(0);
    expect(d.getUTCDate()).toBe(1);
    expect(d.getUTCHours()).toBe(12);
  });

  test("a Saturday rolls forward to Monday", () => {
    // 2026-01-03 is a Saturday -> Monday 2026-01-05
    const d = adjustToNextBusinessDayUTC(2026, 0, 3);
    expect(d.getUTCDate()).toBe(5);
    expect(d.getUTCDay()).toBe(1); // Monday
  });

  test("a Sunday rolls forward to Monday", () => {
    // 2026-01-04 is a Sunday -> Monday 2026-01-05
    const d = adjustToNextBusinessDayUTC(2026, 0, 4);
    expect(d.getUTCDate()).toBe(5);
    expect(d.getUTCDay()).toBe(1);
  });

  test("PINS current behavior: national holidays are NOT skipped", () => {
    // 2026-05-01 (Día del Trabajador) is a Friday and a national holiday.
    // The current implementation only skips weekends, so it stays on May 1.
    // When holiday awareness is added, this test must be updated on purpose.
    const d = adjustToNextBusinessDayUTC(2026, 4, 1);
    expect(d.getUTCDate()).toBe(1);
    expect(d.getUTCDay()).toBe(5); // Friday
  });
});
