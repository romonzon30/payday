const holidays2026 = [
  "2026-01-01",
  "2026-02-16",
  "2026-02-17",
  "2026-03-24",
  "2026-04-02",
  "2026-04-03",
  "2026-05-01",
  "2026-05-25",
  "2026-06-17",
  "2026-06-20",
  "2026-07-09",
  "2026-08-17",
  "2026-10-12",
  "2026-11-20",
  "2026-12-08",
  "2026-12-25",
];

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function isHoliday(date) {
  return holidays2026.includes(formatDate(date));
}

function getNextBusinessDay(date) {
  const newDate = new Date(date);

  while (isWeekend(newDate) || isHoliday(newDate)) {
    newDate.setDate(newDate.getDate() + 1);
  }

  return formatDate(newDate);
}

module.exports = {
  getNextBusinessDay,
};