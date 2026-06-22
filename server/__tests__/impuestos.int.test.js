const request = require("supertest");
const { connect, disconnect, clearDb, buildApp, makeUserWithToken } = require("./setup");

let app;
beforeAll(async () => {
  await connect();
  app = buildApp();
});
afterAll(disconnect);
beforeEach(clearDb);

const auth = (token) => ({ Authorization: `Bearer ${token}` });
const NEXT_YEAR = new Date().getUTCFullYear() + 1;
const LAST_YEAR = new Date().getUTCFullYear() - 1;

async function userWithCuit() {
  return makeUserWithToken({ cuit: "20-12345678-9", perfilCompleto: true });
}

describe("/api/impuestos", () => {
  test("preview returns the full tax calendar with yaAgregado flags", async () => {
    const { token } = await userWithCuit();
    const res = await request(app)
      .get(`/api/impuestos/preview?year=${NEXT_YEAR}&month=0`)
      .set(auth(token))
      .expect(200);
    expect(res.body.impuestos).toHaveLength(10);
    expect(res.body.impuestos.every((i) => i.yaAgregado === false)).toBe(true);
    expect(res.body.cuitUltimoDigito).toBe(9);
  });

  test("agregar creates a future vencimiento and dedupes", async () => {
    const { token } = await userWithCuit();
    const body = { impuestoId: "iva", year: NEXT_YEAR, month: 0, monto: 1000 };

    await request(app).post("/api/impuestos/agregar").set(auth(token)).send(body).expect(201);
    // second time -> duplicate
    await request(app).post("/api/impuestos/agregar").set(auth(token)).send(body).expect(409);

    // now preview flags it as added
    const res = await request(app).get(`/api/impuestos/preview?year=${NEXT_YEAR}&month=0`).set(auth(token)).expect(200);
    expect(res.body.impuestos.find((i) => i.id === "iva").yaAgregado).toBe(true);
  });

  test("agregar rejects a past month and a non-positive monto", async () => {
    const { token } = await userWithCuit();
    await request(app)
      .post("/api/impuestos/agregar")
      .set(auth(token))
      .send({ impuestoId: "iva", year: LAST_YEAR, month: 0, monto: 1000 })
      .expect(400);
    await request(app)
      .post("/api/impuestos/agregar")
      .set(auth(token))
      .send({ impuestoId: "iva", year: NEXT_YEAR, month: 0, monto: 0 })
      .expect(400);
  });

  test("delete removes an added tax vencimiento", async () => {
    const { token } = await userWithCuit();
    const created = await request(app)
      .post("/api/impuestos/agregar")
      .set(auth(token))
      .send({ impuestoId: "autonomos", year: NEXT_YEAR, month: 0, monto: 500 })
      .expect(201);
    const id = created.body.vencimiento._id;
    await request(app).delete(`/api/impuestos/${id}`).set(auth(token)).expect(200);
    await request(app).delete(`/api/impuestos/${id}`).set(auth(token)).expect(404);
  });
});
