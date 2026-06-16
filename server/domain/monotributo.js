// Monotributo amount engine (pure).

// Calculates the final monthly amount applying the user's modifiers:
//  - "primer_anio"  -> 50% of the base monthly amount
//  - "segundo_anio" -> 75% of the base monthly amount
//  - obra social surcharge: + costoPorCarga per dependent, only when the
//    category includes obra social and the user has dependents.
// Returns a value rounded to two decimals, or 0 when no config is given.
function calcMontoFinal(config, user) {
  if (!config) return 0;
  let monto = config.montoMensual;
  if (user.inicioActividad === "primer_anio") monto *= 0.5;
  else if (user.inicioActividad === "segundo_anio") monto *= 0.75;
  if (config.incluyeObraSocial && (user.personasACargo || 0) > 0) {
    monto += (config.costoPorCarga || 0) * (user.personasACargo || 0);
  }
  return Math.round(monto * 100) / 100;
}

module.exports = { calcMontoFinal };
