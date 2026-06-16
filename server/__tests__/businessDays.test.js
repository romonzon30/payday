const { adjustToNextBusinessDayUTC } = require("../domain/businessDays");

describe("adjustToNextBusinessDayUTC", () => {
  test("a normal weekday is returned unchanged at 12:00 UTC", () => {
    // 2026-01-08 is a Thursday and not a holiday
    const d = adjustToNextBusinessDayUTC(2026, 0, 8);
    expect(d.getUTCFullYear()).toBe(2026);
    expect(d.getUTCMonth()).toBe(0);
    expect(d.getUTCDate()).toBe(8);
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

  test("a national holiday is skipped", () => {
    // 2026-05-01 (Día del Trabajador) is a Friday holiday -> rolls over the
    // weekend to Monday 2026-05-04.
    const d = adjustToNextBusinessDayUTC(2026, 4, 1);
    expect(d.getUTCDate()).toBe(4);
    expect(d.getUTCDay()).toBe(1); // Monday
  });

  test("a holiday landing on a weekday rolls to the next free weekday", () => {
    // 2026-01-01 (Año Nuevo) is a Thursday holiday -> Friday 2026-01-02
    const d = adjustToNextBusinessDayUTC(2026, 0, 1);
    expect(d.getUTCDate()).toBe(2);
    expect(d.getUTCDay()).toBe(5); // Friday
  });
});
