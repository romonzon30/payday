// Tax-calendar domain helpers (pure): map a CUIT to its due-date group and
// compute the actual due date for a given tax/month.

const { adjustToNextBusinessDayUTC } = require("./businessDays");

// Returns the last digit of a CUIT (ignoring dashes/spaces); 0 on bad input.
function parseCuitLastDigit(cuit) {
  if (!cuit) return 0;
  const clean = cuit.replace(/[-\s]/g, "");
  const last = clean.slice(-1);
  const n = parseInt(last, 10);
  return isNaN(n) ? 0 : n;
}

// Returns the group whose digits include lastDigit, falling back to the first.
function getGrupoForDigit(impuesto, lastDigit) {
  return impuesto.grupos.find((g) => g.digits.includes(lastDigit)) || impuesto.grupos[0];
}

// Computes the due date (UTC-noon Date) for a tax, CUIT and month.
function computeVencimientoDate(impuesto, lastDigit, year, month) {
  const grupo = getGrupoForDigit(impuesto, lastDigit);
  return adjustToNextBusinessDayUTC(year, month, grupo.baseDia);
}

module.exports = { parseCuitLastDigit, getGrupoForDigit, computeVencimientoDate };
