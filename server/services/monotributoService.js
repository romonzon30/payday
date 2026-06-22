// Monotributo vencimiento reconciliation: ensures each month of the year has
// the correct pending doc; paid months are left untouched.

const ConfiguracionAfip = require("../models/ConfiguracionAfip");
const Vencimiento = require("../models/Vencimiento");
const { adjustToNextBusinessDayUTC } = require("../domain/businessDays");
const { calcMontoFinal } = require("../domain/monotributo");

async function upsertMonotributoVencimientos(user, year) {
  if (!user.perfilCompleto || !user.cuit || !user.categoriaMonotributo) return;

  const config = await ConfiguracionAfip.findOne({ categoria: user.categoriaMonotributo });
  const expectedMonto = calcMontoFinal(config, user);

  for (let month = 0; month < 12; month++) {
    const monthStart = new Date(Date.UTC(year, month, 1));
    const monthEnd = new Date(Date.UTC(year, month + 1, 1));

    const hasPaid = await Vencimiento.exists({
      userId: user._id,
      tipo: "monotributo",
      fechaVencimiento: { $gte: monthStart, $lt: monthEnd },
      estado: { $in: ["pagado", "al_dia"] },
    });
    if (hasPaid) continue;

    const expectedDate = adjustToNextBusinessDayUTC(year, month, 20);
    const expectedISO = expectedDate.toISOString();

    const existing = await Vencimiento.findOne({
      userId: user._id,
      tipo: "monotributo",
      fechaVencimiento: { $gte: monthStart, $lt: monthEnd },
      estado: "pendiente",
    });

    const alreadyCorrect =
      existing &&
      new Date(existing.fechaVencimiento).toISOString() === expectedISO &&
      Math.round(Number(existing.monto) * 100) === Math.round(expectedMonto * 100) &&
      existing.notificarEmail === true;

    if (!alreadyCorrect) {
      await Vencimiento.deleteMany({
        userId: user._id,
        tipo: "monotributo",
        fechaVencimiento: { $gte: monthStart, $lt: monthEnd },
        estado: "pendiente",
      });
      await Vencimiento.create({
        userId: user._id,
        tipo: "monotributo",
        descripcion: "AFIP - Monotributo",
        monto: expectedMonto,
        fechaVencimiento: expectedDate,
        estado: "pendiente",
        notificarEmail: true,
      });
    }
  }
}

module.exports = { upsertMonotributoVencimientos };
