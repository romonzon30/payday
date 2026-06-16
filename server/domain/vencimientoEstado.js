// Derives the display estado of a vencimiento at render time (pure).
//
// The stored estado is authoritative only for paid docs; for pending ones the
// effective estado depends on the queried period vs. "now":
//  - custom docs: pagado/al_dia stay al_dia; otherwise vencido if the date has
//    passed, else pendiente.
//  - monotributo/tax docs: past months collapse to al_dia; in the current month
//    a >2-day grace turns it al_dia, within grace it is vencido, before it is
//    pendiente; future months stay pendiente.
//
// `month` is 1-indexed (matches the API query param).
function computeEstado(v, year, month, now) {
  const currentMonth = now.getUTCMonth() + 1;
  const currentYear = now.getUTCFullYear();

  let estado = v.estado;
  const vencDate = new Date(v.fechaVencimiento);
  const vencDay = vencDate.getUTCDate();

  if (v.tipo === "custom") {
    if (estado === "pagado" || estado === "al_dia") {
      estado = "al_dia";
    } else {
      estado = vencDate < now ? "vencido" : "pendiente";
    }
  } else if (estado === "pagado" || estado === "al_dia") {
    estado = "al_dia";
  } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
    estado = "al_dia";
  } else if (year === currentYear && month === currentMonth) {
    if (now.getUTCDate() > vencDay + 2) estado = "al_dia";
    else if (now.getUTCDate() > vencDay) estado = "vencido";
    else estado = "pendiente";
  } else {
    estado = "pendiente";
  }

  return estado;
}

module.exports = { computeEstado };
