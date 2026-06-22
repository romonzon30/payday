const { calcMontoFinal } = require("../domain/monotributo");

const baseConfig = {
  montoMensual: 56501.85,
  incluyeObraSocial: true,
  costoPorCarga: 12500,
};

describe("calcMontoFinal", () => {
  test("returns 0 when there is no config", () => {
    expect(calcMontoFinal(null, { inicioActividad: "normal" })).toBe(0);
  });

  test("normal activity, no dependents -> base amount unchanged", () => {
    const config = { montoMensual: 48250.78, incluyeObraSocial: false, costoPorCarga: 0 };
    expect(calcMontoFinal(config, { inicioActividad: "normal", personasACargo: 0 })).toBe(48250.78);
  });

  test("primer_anio applies a 50% discount", () => {
    const monto = calcMontoFinal({ ...baseConfig, incluyeObraSocial: false }, { inicioActividad: "primer_anio" });
    expect(monto).toBe(Math.round(56501.85 * 0.5 * 100) / 100);
  });

  test("segundo_anio applies a 75% factor", () => {
    const monto = calcMontoFinal({ ...baseConfig, incluyeObraSocial: false }, { inicioActividad: "segundo_anio" });
    expect(monto).toBe(Math.round(56501.85 * 0.75 * 100) / 100);
  });

  test("obra social + dependents adds costoPorCarga per dependent", () => {
    const monto = calcMontoFinal(baseConfig, { inicioActividad: "normal", personasACargo: 2 });
    expect(monto).toBe(Math.round((56501.85 + 12500 * 2) * 100) / 100);
  });

  test("dependents are ignored when category has no obra social", () => {
    const config = { montoMensual: 42386.74, incluyeObraSocial: false, costoPorCarga: 0 };
    expect(calcMontoFinal(config, { inicioActividad: "normal", personasACargo: 3 })).toBe(42386.74);
  });

  test("discount and obra social surcharge combine", () => {
    const monto = calcMontoFinal(baseConfig, { inicioActividad: "primer_anio", personasACargo: 1 });
    expect(monto).toBe(Math.round((56501.85 * 0.5 + 12500) * 100) / 100);
  });

  test("result is rounded to two decimals", () => {
    const monto = calcMontoFinal({ montoMensual: 100.005, incluyeObraSocial: false }, { inicioActividad: "normal" });
    expect(monto).toBe(100.01);
  });
});
