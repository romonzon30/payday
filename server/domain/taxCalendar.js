// Tax-calendar domain helpers (pure): map a CUIT to its due-date group and
// compute the actual due date for a given tax/month.

const { adjustToNextBusinessDayUTC } = require("./businessDays");

// Validates a CUIT/CUIL: 11 digits (dashes/spaces ignored) with a correct
// verification digit (mod-11 algorithm). Rejects garbage that would otherwise
// silently produce a wrong tax calendar.
function isValidCuit(cuit) {
  if (!cuit) return false;
  const clean = String(cuit).replace(/[-\s]/g, "");
  if (!/^\d{11}$/.test(clean)) return false;
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(clean[i], 10) * weights[i];
  let check = 11 - (sum % 11);
  if (check === 11) check = 0;
  if (check === 10) return false;
  return check === parseInt(clean[10], 10);
}

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

module.exports = { isValidCuit, parseCuitLastDigit, getGrupoForDigit, computeVencimientoDate };
