// Vencimiento operations for the user-facing calendar (monotributo + custom).

const Vencimiento = require("../models/Vencimiento");
const { computeEstado } = require("../domain/vencimientoEstado");
const { upsertMonotributoVencimientos } = require("./monotributoService");
const { HttpError } = require("../middleware/errorHandler");

// Lists a month's vencimientos with their effective (render-time) estado.
async function listForMonth(user, year, month) {
  await upsertMonotributoVencimientos(user, year);

  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 1));
  const vencimientos = await Vencimiento.find({
    userId: user._id,
    fechaVencimiento: { $gte: monthStart, $lt: monthEnd },
  })
    .sort({ fechaVencimiento: 1 })
    .lean();

  const now = new Date();
  return vencimientos.map((v) => ({
    _id: v._id,
    tipo: v.tipo,
    titulo: v.titulo || "",
    descripcion: v.descripcion,
    monto: v.monto,
    fechaVencimiento: v.fechaVencimiento,
    estado: computeEstado(v, year, month, now),
    notificarEmail: !!v.notificarEmail,
  }));
}

// Creates a custom vencimiento, or one per remaining month when recurrente.
// Returns the response body (shape differs for single vs. recurrente).
async function createCustom(user, { titulo, descripcion, monto, fechaVencimiento, notificarEmail, recurrente }) {
  if (!titulo || !titulo.trim()) throw new HttpError(400, "Título requerido");
  if (!fechaVencimiento) throw new HttpError(400, "Fecha requerida");

  const fecha = new Date(fechaVencimiento + "T12:00:00");
  if (Number.isNaN(fecha.getTime())) throw new HttpError(400, "Fecha inválida");

  const baseData = {
    userId: user._id,
    tipo: "custom",
    titulo: titulo.trim(),
    descripcion: (descripcion || titulo).trim(),
    monto: Number(monto) || 0,
    estado: "pendiente",
    notificarEmail: !!notificarEmail,
    recurrente: !!recurrente,
  };

  if (recurrente) {
    const day = fecha.getDate();
    const year = fecha.getFullYear();
    const startMonth = fecha.getMonth();
    const docs = [];
    for (let m = startMonth; m < 12; m++) {
      const lastDayOfMonth = new Date(year, m + 1, 0).getDate();
      const vencDay = Math.min(day, lastDayOfMonth);
      docs.push({ ...baseData, fechaVencimiento: new Date(year, m, vencDay, 12, 0, 0) });
    }
    const created = await Vencimiento.insertMany(docs);
    return { vencimientos: created };
  }

  const venc = await Vencimiento.create({ ...baseData, fechaVencimiento: fecha });
  return { vencimiento: venc };
}

// Deletes a user's own custom vencimiento.
async function removeCustom(user, id) {
  const venc = await Vencimiento.findOne({ _id: id, userId: user._id });
  if (!venc) throw new HttpError(404, "Vencimiento no encontrado");
  if (venc.tipo !== "custom") throw new HttpError(403, "Solo se pueden eliminar vencimientos custom");
  await venc.deleteOne();
}

// Updates a vencimiento's estado (pagar / desmarcar).
async function updateEstado(user, id, estado) {
  if (!["pagado", "pendiente"].includes(estado)) throw new HttpError(400, "Estado inválido");

  const venc = await Vencimiento.findOne({ _id: id, userId: user._id });
  if (!venc) throw new HttpError(404, "Vencimiento no encontrado");

  venc.estado = estado;
  venc.fechaPago = estado === "pagado" ? new Date() : null;
  await venc.save();
  return venc;
}

module.exports = { listForMonth, createCustom, removeCustom, updateEstado };
