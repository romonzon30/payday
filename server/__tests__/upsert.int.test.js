const request = require("supertest");
const { connect, disconnect, clearDb, buildApp, seedCategoria, makeUserWithToken } = require("./setup");
const Vencimiento = require("../models/Vencimiento");
const User = require("../models/User");

const YEAR = new Date().getUTCFullYear();
const yearStart = new Date(Date.UTC(YEAR, 0, 1));
const yearEnd = new Date(Date.UTC(YEAR + 1, 0, 1));

let app;

beforeAll(async () => {
  await connect();
  app = buildApp();
});
afterAll(disconnect);
beforeEach(clearDb);

async function monotributoDocs(userId) {
  return Vencimiento.find({
    userId,
    tipo: "monotributo",
    fechaVencimiento: { $gte: yearStart, $lt: yearEnd },
  }).sort({ fechaVencimiento: 1 });
}

async function completeUser(overrides = {}) {
  return makeUserWithToken({
    cuit: "20-12345678-9",
    categoriaMonotributo: "C",
    perfilCompleto: true,
    ...overrides,
  });
}

describe("upsertMonotributoVencimientos (via GET /api/user/me)", () => {
  test("creates 12 pending monotributo vencimientos for the year", async () => {
    await seedCategoria();
    const { token, user } = await completeUser();

    await request(app).get("/api/user/me").set("Authorization", `Bearer ${token}`).expect(200);

    const docs = await monotributoDocs(user._id);
    expect(docs).toHaveLength(12);
    expect(docs.every((d) => d.estado === "pendiente")).toBe(true);
    expect(docs.every((d) => d.notificarEmail === true)).toBe(true);
    expect(docs.every((d) => d.monto === 56501.85)).toBe(true);
    // Each due date is the next business day on/after the 20th.
    expect(docs.every((d) => new Date(d.fechaVencimiento).getUTCDate() >= 20)).toBe(true);
  });

  test("is idempotent — running twice does not duplicate", async () => {
    await seedCategoria();
    const { token, user } = await completeUser();

    await request(app).get("/api/user/me").set("Authorization", `Bearer ${token}`).expect(200);
    await request(app).get("/api/user/me").set("Authorization", `Bearer ${token}`).expect(200);

    expect(await monotributoDocs(user._id)).toHaveLength(12);
  });

  test("does not touch months already marked as paid", async () => {
    await seedCategoria();
    const { token, user } = await completeUser();

    await request(app).get("/api/user/me").set("Authorization", `Bearer ${token}`).expect(200);

    const [firstMonthDoc] = await monotributoDocs(user._id);
    firstMonthDoc.estado = "pagado";
    firstMonthDoc.monto = 1; // intentionally wrong; must be preserved
    await firstMonthDoc.save();

    await request(app).get("/api/user/me").set("Authorization", `Bearer ${token}`).expect(200);

    const reloaded = await Vencimiento.findById(firstMonthDoc._id);
    expect(reloaded.estado).toBe("pagado");
    expect(reloaded.monto).toBe(1);
    expect(await monotributoDocs(user._id)).toHaveLength(12);
  });

  test("recreates a pending doc when the expected amount drifts", async () => {
    await seedCategoria();
    const { token, user } = await completeUser();

    await request(app).get("/api/user/me").set("Authorization", `Bearer ${token}`).expect(200);

    // Add two dependents -> obra-social surcharge changes the expected monto.
    await User.findByIdAndUpdate(user._id, { personasACargo: 2 });

    await request(app).get("/api/user/me").set("Authorization", `Bearer ${token}`).expect(200);

    const docs = await monotributoDocs(user._id);
    const expected = Math.round((56501.85 + 12500 * 2) * 100) / 100;
    expect(docs).toHaveLength(12);
    expect(docs.every((d) => d.monto === expected)).toBe(true);
  });
});
