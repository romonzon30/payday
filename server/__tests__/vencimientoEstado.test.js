const { computeEstado } = require("../domain/vencimientoEstado");

// Fixed reference: 2026-06-16 (current month = June, 1-indexed 6).
const NOW = new Date(Date.UTC(2026, 5, 16, 12, 0, 0));
const venc = (overrides) => ({ tipo: "monotributo", estado: "pendiente", ...overrides });

describe("computeEstado — custom vencimientos", () => {
  test("paid custom -> al_dia", () => {
    const v = venc({ tipo: "custom", estado: "pagado", fechaVencimiento: new Date(Date.UTC(2026, 5, 10, 12)) });
    expect(computeEstado(v, 2026, 6, NOW)).toBe("al_dia");
  });

  test("pending custom in the past -> vencido", () => {
    const v = venc({ tipo: "custom", fechaVencimiento: new Date(Date.UTC(2026, 5, 10, 12)) });
    expect(computeEstado(v, 2026, 6, NOW)).toBe("vencido");
  });

  test("pending custom in the future -> pendiente", () => {
    const v = venc({ tipo: "custom", fechaVencimiento: new Date(Date.UTC(2026, 5, 20, 12)) });
    expect(computeEstado(v, 2026, 6, NOW)).toBe("pendiente");
  });
});

describe("computeEstado — monotributo/tax vencimientos", () => {
  test("paid -> al_dia", () => {
    const v = venc({ estado: "pagado", fechaVencimiento: new Date(Date.UTC(2026, 5, 20, 12)) });
    expect(computeEstado(v, 2026, 6, NOW)).toBe("al_dia");
  });

  test("past month -> al_dia", () => {
    const v = venc({ fechaVencimiento: new Date(Date.UTC(2026, 4, 20, 12)) });
    expect(computeEstado(v, 2026, 5, NOW)).toBe("al_dia");
  });

  test("past year -> al_dia", () => {
    const v = venc({ fechaVencimiento: new Date(Date.UTC(2025, 11, 20, 12)) });
    expect(computeEstado(v, 2025, 12, NOW)).toBe("al_dia");
  });

  test("future month -> pendiente", () => {
    const v = venc({ fechaVencimiento: new Date(Date.UTC(2026, 6, 20, 12)) });
    expect(computeEstado(v, 2026, 7, NOW)).toBe("pendiente");
  });

  test("current month, before due day -> pendiente", () => {
    const v = venc({ fechaVencimiento: new Date(Date.UTC(2026, 5, 20, 12)) });
    expect(computeEstado(v, 2026, 6, NOW)).toBe("pendiente");
  });

  test("current month, within 2-day grace after due -> vencido", () => {
    const v = venc({ fechaVencimiento: new Date(Date.UTC(2026, 5, 14, 12)) }); // now=16, 14<16<=16
    expect(computeEstado(v, 2026, 6, NOW)).toBe("vencido");
  });

  test("current month, past the 2-day grace -> al_dia", () => {
    const v = venc({ fechaVencimiento: new Date(Date.UTC(2026, 5, 13, 12)) }); // now=16 > 13+2
    expect(computeEstado(v, 2026, 6, NOW)).toBe("al_dia");
  });
});
