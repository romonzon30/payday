const router = require("express").Router();
const authMiddleware = require("../middleware/auth");
const ConfiguracionAfip = require("../models/ConfiguracionAfip");
const Vencimiento = require("../models/Vencimiento");
const { adjustToNextBusinessDayUTC } = require("../domain/businessDays");
const { calcMontoFinal } = require("../domain/monotributo");
const { computeEstado } = require("../domain/vencimientoEstado");

// Per-month reconciliation: ensures each month has the correct pending doc; paid months are untouched
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

// GET /api/user/debug — devuelve datos de debug para monotributo.
router.get("/debug", authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    if (!user.perfilCompleto || !user.cuit || !user.categoriaMonotributo) {
      return res.status(400).json({ message: "Perfil incompleto: cuit/categoria requeridos" });
    }
    const year = new Date().getUTCFullYear();
    const config = await ConfiguracionAfip.findOne({ categoria: user.categoriaMonotributo });
    const monto = calcMontoFinal(config, user);
    const expected = [];
    for (let month = 0; month < 12; month++) {
      expected.push({ mes: month + 1, fechaVencimiento: adjustToNextBusinessDayUTC(year, month, 20), monto });
    }
    const actual = await Vencimiento.find({
      userId: user._id,
      tipo: "monotributo",
      fechaVencimiento: { $gte: new Date(Date.UTC(year, 0, 1)), $lt: new Date(Date.UTC(year + 1, 0, 1)) },
    }).lean();
    return res.json({ user: { categoriaMonotributo: user.categoriaMonotributo, cuit: user.cuit }, config, expected, actual });
  } catch (err) {
    console.error("Error en /debug:", err.message);
    res.status(500).json({ message: "Error de debug" });
  }
});

// GET /api/user/me — devuelve el usuario autenticado.
// Si tiene CUIL + categoría, asegura vencimientos del año actual.
router.get("/me", authMiddleware, async (req, res) => {
  try {
    await upsertMonotributoVencimientos(req.user, new Date().getUTCFullYear());
  } catch (err) {
    console.error("Error asegurando vencimientos en /me:", err.message);
  }
  res.json({ user: req.user });
});

// PUT /api/user/profile — actualizar perfil
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { nombreCompleto, cuit, emailNotificaciones, categoriaMonotributo, inicioActividad, personasACargo } = req.body;
    const user = req.user;

    if (nombreCompleto) user.nombreCompleto = nombreCompleto.trim();
    if (emailNotificaciones) user.emailNotificaciones = emailNotificaciones.trim();
    if (cuit && cuit.trim()) user.cuit = cuit.trim();

    if (categoriaMonotributo) {
      const categoria = String(categoriaMonotributo).trim().toUpperCase();
      const config = await ConfiguracionAfip.findOne({ categoria });
      if (!config) return res.status(400).json({ message: "Categoría de monotributo inválida" });
      user.categoriaMonotributo = config.categoria;
      user.fechaInscripcion = user.fechaInscripcion || new Date();
    }

    if (inicioActividad !== undefined) {
      if (!["normal", "primer_anio", "segundo_anio"].includes(inicioActividad)) {
        return res.status(400).json({ message: "Valor de inicio de actividad inválido" });
      }
      user.inicioActividad = inicioActividad;
    }

    if (personasACargo !== undefined) {
      const n = parseInt(personasACargo, 10);
      if (isNaN(n) || n < 0 || n > 5) {
        return res.status(400).json({ message: "Personas a cargo debe ser entre 0 y 5" });
      }
      user.personasACargo = n;
    }

    user.perfilCompleto = !!user.cuit && !!user.categoriaMonotributo;
    await user.save();

    if (user.perfilCompleto) {
      await upsertMonotributoVencimientos(user, new Date().getUTCFullYear());
    }

    res.json({ user });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: "El CUIL ya está registrado por otro usuario" });
    console.error("Error en PUT /profile:", err.message);
    res.status(500).json({ message: "Error al actualizar perfil" });
  }
});

// GET /api/user/vencimientos — vencimientos del mes (monotributo + custom)
router.get("/vencimientos", authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const year = parseInt(req.query.year) || new Date().getUTCFullYear();
    const month = parseInt(req.query.month) || new Date().getUTCMonth() + 1;

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

    const result = vencimientos.map((v) => {
      const estado = computeEstado(v, year, month, now);

      return {
        _id: v._id,
        tipo: v.tipo,
        titulo: v.titulo || "",
        descripcion: v.descripcion,
        monto: v.monto,
        fechaVencimiento: v.fechaVencimiento,
        estado,
        notificarEmail: !!v.notificarEmail,
      };
    });

    res.json({ vencimientos: result });
  } catch (err) {
    console.error("Error en /vencimientos:", err.message);
    res.status(500).json({ message: "Error al obtener vencimientos" });
  }
});

// POST /api/user/vencimientos — crear un vencimiento custom
router.post("/vencimientos", authMiddleware, async (req, res) => {
  try {
    const { titulo, descripcion, monto, fechaVencimiento, notificarEmail, recurrente } = req.body;

    if (!titulo || !titulo.trim()) {
      return res.status(400).json({ message: "Título requerido" });
    }
    if (!fechaVencimiento) {
      return res.status(400).json({ message: "Fecha requerida" });
    }

    const fecha = new Date(fechaVencimiento + "T12:00:00");
    if (Number.isNaN(fecha.getTime())) {
      return res.status(400).json({ message: "Fecha inválida" });
    }

    const baseData = {
      userId: req.user._id,
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
        docs.push({
          ...baseData,
          fechaVencimiento: new Date(year, m, vencDay, 12, 0, 0),
        });
      }

      const created = await Vencimiento.insertMany(docs);
      return res.status(201).json({ vencimientos: created });
    }

    const venc = await Vencimiento.create({
      ...baseData,
      fechaVencimiento: fecha,
    });

    res.status(201).json({ vencimiento: venc });
  } catch (err) {
    console.error("Error creando vencimiento custom:", err.message);
    res.status(500).json({ message: "Error al crear vencimiento" });
  }
});

// DELETE /api/user/vencimientos/:id — eliminar un vencimiento custom propio
router.delete("/vencimientos/:id", authMiddleware, async (req, res) => {
  try {
    const venc = await Vencimiento.findOne({ _id: req.params.id, userId: req.user._id });
    if (!venc) return res.status(404).json({ message: "Vencimiento no encontrado" });
    if (venc.tipo !== "custom") {
      return res.status(403).json({ message: "Solo se pueden eliminar vencimientos custom" });
    }
    await venc.deleteOne();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ message: "Error al eliminar vencimiento" });
  }
});

// PATCH /api/user/vencimientos/:id — actualizar estado (pagar / desmarcar)
router.patch("/vencimientos/:id", authMiddleware, async (req, res) => {
  try {
    const { estado } = req.body;
    if (!["pagado", "pendiente"].includes(estado)) {
      return res.status(400).json({ message: "Estado inválido" });
    }

    const venc = await Vencimiento.findOne({ _id: req.params.id, userId: req.user._id });
    if (!venc) return res.status(404).json({ message: "Vencimiento no encontrado" });

    venc.estado = estado;
    venc.fechaPago = estado === "pagado" ? new Date() : null;
    await venc.save();

    res.json({ vencimiento: venc });
  } catch (err) {
    res.status(500).json({ message: "Error al actualizar vencimiento" });
  }
});

module.exports = router;
