const request = require("supertest");
const { connect, disconnect, clearDb, buildApp, seedCategoria, makeUserWithToken } = require("./setup");

let app;
beforeAll(async () => {
  await connect();
  app = buildApp();
});
afterAll(disconnect);
beforeEach(clearDb);

const auth = (token) => ({ Authorization: `Bearer ${token}` });

describe("PUT /api/user/profile", () => {
  test("rejects an invalid CUIT with 400", async () => {
    const { token } = await makeUserWithToken();
    await request(app)
      .put("/api/user/profile")
      .set(auth(token))
      .send({ nombreCompleto: "Ada", emailNotificaciones: "ada@test.com", cuit: "20-12345678-9" })
      .expect(400);
  });

  test("accepts a valid CUIT + categoria and marks the profile complete", async () => {
    await seedCategoria({ categoria: "C" });
    const { token } = await makeUserWithToken();
    const res = await request(app)
      .put("/api/user/profile")
      .set(auth(token))
      .send({
        nombreCompleto: "Ada",
        emailNotificaciones: "ada@test.com",
        cuit: "20-12345678-6",
        categoriaMonotributo: "C",
      })
      .expect(200);
    expect(res.body.user.perfilCompleto).toBe(true);
    expect(res.body.user.cuit).toBe("20-12345678-6");
  });

  test("does not leak internal fields (googleUid) in the response DTO", async () => {
    const { token } = await makeUserWithToken();
    const res = await request(app).get("/api/user/me").set(auth(token)).expect(200);
    expect(res.body.user).toHaveProperty("email");
    expect(res.body.user).not.toHaveProperty("googleUid");
    expect(res.body.user).not.toHaveProperty("__v");
  });
});
