// Pure business-day helpers (UTC, noon to avoid timezone drift).
//
// NOTE: this implementation skips weekends only. Holiday awareness is added
// in a later refactor step by passing a holiday list; current callers rely on
// the weekend-only behavior, which the test suite pins.

// Returns a UTC-noon Date for the first business day on or after the given day.
function adjustToNextBusinessDayUTC(year, month, day) {
  const d = new Date(Date.UTC(year, month, day, 12, 0, 0));
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) {
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return d;
}

module.exports = { adjustToNextBusinessDayUTC };
