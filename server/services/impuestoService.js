// AFIP tax-calendar operations: preview upcoming due dates and persist selected
// ones as Vencimiento docs.

const Vencimiento = require("../models/Vencimiento");
const { IMPUESTOS } = require("../data/taxCalendar2026");
const { adjustToNextBusinessDayUTC } = require("../domain/businessDays");
const { parseCuitLastDigit, getGrupoForDigit } = require("../domain/taxCalendar");
const { HttpError } = require("../middleware/errorHandler");

const IMPUESTO_IDS = IMPUESTOS.map((i) => i.id);

// Computes the tax calendar for a month, flagging already-added taxes.
async function preview(user, year, month) {
  const lastDigit = parseCuitLastDigit(user.cuit);
  const monthStart = new Date(Date.UTC(year, month, 1));
  const monthEnd = new Date(Date.UTC(year, month + 1, 1));

  const existing = await Vencimiento.find({
    userId: user._id,
    tipo: { $in: IMPUESTO_IDS },
    fechaVencimiento: { $gte: monthStart, $lt: monthEnd },
  }).select("tipo _id");

  const addedMap = {};
  for (const v of existing) addedMap[v.tipo] = v._id.toString();

  const impuestos = IMPUESTOS.map((imp) => {
    const grupo = getGrupoForDigit(imp, lastDigit);
    const fechaVencimiento = adjustToNextBusinessDayUTC(year, month, grupo.baseDia);
    return {
      id: imp.id,
      nombre: imp.nombre,
      descripcion: imp.descripcion,
      categoria: imp.categoria,
      cuitGrupo: grupo.digits,
      fechaVencimiento: fechaVencimiento.toISOString(),
      yaAgregado: !!addedMap[imp.id],
      vencimientoId: addedMap[imp.id] || null,
    };
  });

  return { impuestos, cuitUltimoDigito: lastDigit, anio: year, mes: month };
}

// Persists a tax vencimiento for one month, or for all remaining months when
// periodico. Returns the response body.
async function agregar(user, { impuestoId, year, month, monto, notificarEmail = true, periodico = false }) {
  const montoNum = parseFloat(monto);
  if (!monto || isNaN(montoNum) || montoNum <= 0) throw new HttpError(400, "El monto debe ser mayor a $0");

  const imp = IMPUESTOS.find((i) => i.id === impuestoId);
  if (!imp) throw new HttpError(400, "Impuesto no válido");

  const lastDigit = parseCuitLastDigit(user.cuit);
  const grupo = getGrupoForDigit(imp, lastDigit);
  const now = new Date();

  if (periodico) {
    const created = [];
    for (let m = month; m <= 11; m++) {
      const fecha = adjustToNextBusinessDayUTC(year, m, grupo.baseDia);
      if (fecha <= now) continue;

      const mStart = new Date(Date.UTC(year, m, 1));
      const mEnd = new Date(Date.UTC(year, m + 1, 1));
      const exists = await Vencimiento.findOne({
        userId: user._id,
        tipo: imp.id,
        fechaVencimiento: { $gte: mStart, $lt: mEnd },
      });
      if (exists) continue;

      const v = await Vencimiento.create({
        userId: user._id,
        tipo: imp.id,
        titulo: imp.nombre,
        descripcion: imp.descripcion,
        monto: montoNum,
        fechaVencimiento: fecha,
        estado: "pendiente",
        notificarEmail,
        recurrente: true,
      });
      created.push(v);
    }
    if (created.length === 0) throw new HttpError(400, "No hay meses futuros disponibles para agregar");
    return { vencimientos: created, count: created.length };
  }

  const fechaVencimiento = adjustToNextBusinessDayUTC(year, month, grupo.baseDia);
  if (fechaVencimiento <= now) {
    throw new HttpError(400, "La fecha de vencimiento ya pasó. Seleccioná un mes futuro o usá la opción periódica.");
  }

  const monthStart = new Date(Date.UTC(year, month, 1));
  const monthEnd = new Date(Date.UTC(year, month + 1, 1));
  const existing = await Vencimiento.findOne({
    userId: user._id,
    tipo: imp.id,
    fechaVencimiento: { $gte: monthStart, $lt: monthEnd },
  });
  if (existing) throw new HttpError(409, "Ya existe este vencimiento para este mes");

  const vencimiento = await Vencimiento.create({
    userId: user._id,
    tipo: imp.id,
    titulo: imp.nombre,
    descripcion: imp.descripcion,
    monto: montoNum,
    fechaVencimiento,
    estado: "pendiente",
    notificarEmail,
    recurrente: false,
  });

  return { vencimiento };
}

// Deletes an added tax vencimiento owned by the user.
async function remove(user, vencimientoId) {
  const v = await Vencimiento.findOneAndDelete({
    _id: vencimientoId,
    userId: user._id,
    tipo: { $in: IMPUESTO_IDS },
  });
  if (!v) throw new HttpError(404, "Vencimiento no encontrado");
}

module.exports = { preview, agregar, remove };
