// Email sending is mocked: these tests exercise the window selection, the
// idempotency guards and the atomic claim/revert — not real SMTP.
jest.mock("../services/emailService", () => ({
  sendVencimientoEmail: jest.fn(),
  verifyTransporter: jest.fn(),
}));

const mongoose = require("mongoose");
const { connect, disconnect, clearDb } = require("./setup");
const { sendVencimientoEmail } = require("../services/emailService");
const { checkAndNotify } = require("../services/notificationScheduler");
const User = require("../models/User");
const Vencimiento = require("../models/Vencimiento");
const Notificacion = require("../models/Notificacion");

beforeAll(connect);
afterAll(disconnect);
beforeEach(async () => {
  await clearDb();
  sendVencimientoEmail.mockReset();
  sendVencimientoEmail.mockResolvedValue(true);
});

const inHours = (h) => new Date(Date.now() + h * 3600 * 1000);

async function makeUser() {
  return User.create({
    googleUid: `u-${new mongoose.Types.ObjectId()}`,
    email: "u@test.com",
    emailNotificaciones: "notify@test.com",
    nombreCompleto: "Test User",
  });
}

async function makeVenc(user, overrides = {}) {
  return Vencimiento.create({
    userId: user._id,
    tipo: "monotributo",
    descripcion: "AFIP - Monotributo",
    monto: 1000,
    estado: "pendiente",
    notificarEmail: true,
    fechaVencimiento: inHours(36),
    ...overrides,
  });
}

describe("checkAndNotify", () => {
  test("sends a 48h reminder for a vencimiento due in 24-48h and sets the flag", async () => {
    const user = await makeUser();
    const v = await makeVenc(user, { fechaVencimiento: inHours(36) });

    await checkAndNotify();

    expect(sendVencimientoEmail).toHaveBeenCalledTimes(1);
    expect(sendVencimientoEmail).toHaveBeenCalledWith(expect.objectContaining({ tipo: "48h", to: "notify@test.com" }));
    const fresh = await Vencimiento.findById(v._id);
    expect(fresh.notif48hEnviada).toBe(true);
    expect(await Notificacion.countDocuments({ refId: v._id })).toBe(1);
  });

  test("is idempotent: a second run does not re-send", async () => {
    const user = await makeUser();
    await makeVenc(user, { fechaVencimiento: inHours(36) });

    await checkAndNotify();
    await checkAndNotify();

    expect(sendVencimientoEmail).toHaveBeenCalledTimes(1);
  });

  test("ignores vencimientos with notificarEmail=false", async () => {
    const user = await makeUser();
    await makeVenc(user, { fechaVencimiento: inHours(36), notificarEmail: false });

    await checkAndNotify();

    expect(sendVencimientoEmail).not.toHaveBeenCalled();
  });

  test("marks a due-now vencimiento as vencido and sends the 'hoy' alert", async () => {
    const user = await makeUser();
    const v = await makeVenc(user, { fechaVencimiento: inHours(-1) });

    await checkAndNotify();

    expect(sendVencimientoEmail).toHaveBeenCalledWith(expect.objectContaining({ tipo: "hoy" }));
    const fresh = await Vencimiento.findById(v._id);
    expect(fresh.estado).toBe("vencido");
    expect(fresh.notifVencidoEnviada).toBe(true);
  });

  test("reverts the claim when the email fails, so the next run retries", async () => {
    const user = await makeUser();
    const v = await makeVenc(user, { fechaVencimiento: inHours(36) });
    sendVencimientoEmail.mockResolvedValueOnce(false);

    await checkAndNotify();
    const afterFail = await Vencimiento.findById(v._id);
    expect(afterFail.notif48hEnviada).toBe(false); // reverted

    await checkAndNotify(); // now succeeds
    const afterRetry = await Vencimiento.findById(v._id);
    expect(afterRetry.notif48hEnviada).toBe(true);
    expect(sendVencimientoEmail).toHaveBeenCalledTimes(2);
  });
});
