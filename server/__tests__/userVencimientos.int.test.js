const request = require("supertest");
const { connect, disconnect, clearDb, buildApp, makeUserWithToken } = require("./setup");
const Vencimiento = require("../models/Vencimiento");

let app;
beforeAll(async () => {
  await connect();
  app = buildApp();
});
afterAll(disconnect);
beforeEach(clearDb);

const auth = (token) => ({ Authorization: `Bearer ${token}` });

describe("/api/user/vencimientos", () => {
  test("requires a token", async () => {
    await request(app).get("/api/user/vencimientos").expect(401);
  });

  test("creates a custom vencimiento", async () => {
    const { token } = await makeUserWithToken();
    const res = await request(app)
      .post("/api/user/vencimientos")
      .set(auth(token))
      .send({ titulo: "Alquiler", monto: 1000, fechaVencimiento: "2026-03-15" })
      .expect(201);
    expect(res.body.vencimiento.titulo).toBe("Alquiler");
    expect(res.body.vencimiento.tipo).toBe("custom");
  });

  test("rejects a custom vencimiento without titulo or fecha", async () => {
    const { token } = await makeUserWithToken();
    await request(app).post("/api/user/vencimientos").set(auth(token)).send({ monto: 1 }).expect(400);
    await request(app).post("/api/user/vencimientos").set(auth(token)).send({ titulo: "X" }).expect(400);
  });

  test("recurrente creates one doc per remaining month of the year", async () => {
    const { token, user } = await makeUserWithToken();
    await request(app)
      .post("/api/user/vencimientos")
      .set(auth(token))
      .send({ titulo: "Cuota", monto: 500, fechaVencimiento: "2026-03-15", recurrente: true })
      .expect(201);
    const docs = await Vencimiento.find({ userId: user._id, tipo: "custom" });
    expect(docs).toHaveLength(10); // March..December
  });

  test("patches estado and toggles fechaPago", async () => {
    const { token, user } = await makeUserWithToken();
    const venc = await Vencimiento.create({ userId: user._id, tipo: "custom", titulo: "X", monto: 1, fechaVencimiento: new Date(), estado: "pendiente" });

    const paid = await request(app).patch(`/api/user/vencimientos/${venc._id}`).set(auth(token)).send({ estado: "pagado" }).expect(200);
    expect(paid.body.vencimiento.estado).toBe("pagado");
    expect(paid.body.vencimiento.fechaPago).not.toBeNull();

    await request(app).patch(`/api/user/vencimientos/${venc._id}`).set(auth(token)).send({ estado: "zzz" }).expect(400);
  });

  test("deletes own custom vencimiento but not monotributo ones", async () => {
    const { token, user } = await makeUserWithToken();
    const custom = await Vencimiento.create({ userId: user._id, tipo: "custom", titulo: "X", monto: 1, fechaVencimiento: new Date(), estado: "pendiente" });
    const mono = await Vencimiento.create({ userId: user._id, tipo: "monotributo", monto: 1, fechaVencimiento: new Date(), estado: "pendiente" });

    await request(app).delete(`/api/user/vencimientos/${custom._id}`).set(auth(token)).expect(200);
    await request(app).delete(`/api/user/vencimientos/${mono._id}`).set(auth(token)).expect(403);
  });
});
