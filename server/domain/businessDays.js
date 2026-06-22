// Pure business-day helpers (UTC, noon to avoid timezone drift).
// Skips weekends AND Argentine national holidays.

const { HOLIDAYS_2026 } = require("../data/holidays2026");

const HOLIDAYS = new Set(HOLIDAYS_2026);

function isWeekend(date) {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

function isHoliday(date) {
  return HOLIDAYS.has(date.toISOString().slice(0, 10));
}

// Returns a UTC-noon Date for the first business day on or after the given day.
function adjustToNextBusinessDayUTC(year, month, day) {
  const d = new Date(Date.UTC(year, month, day, 12, 0, 0));
  while (isWeekend(d) || isHoliday(d)) {
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return d;
}

module.exports = { adjustToNextBusinessDayUTC };
