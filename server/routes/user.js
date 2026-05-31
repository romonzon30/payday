const router = require("express").Router();
const authMiddleware = require("../middleware/auth");
const ConfiguracionAfip = require("../models/ConfiguracionAfip");
const Vencimiento = require("../models/Vencimiento");

// Calcula el día de vencimiento según el penúltimo dígito del CUIL
function calcVencDay(cuit) {
  const cuitClean = cuit.replace(/-/g, "");
  const digit = parseInt(cuitClean.slice(-2, -1), 10);
  if (digit <= 1) return 13;
  if (digit <= 3) return 15;
  if (digit <= 5) return 17;
  if (digit <= 7) return 19;
  return 21;
}

// Genera y persiste vencimientos para un año dado
async function generarVencimientosAnio(userId, cuit, categoria, year) {
  const config = await ConfiguracionAfip.findOne({ categoria });
  const monto = config ? config.montoMensual : 0;
  const vencDay = calcVencDay(cuit);

  const docs = [];
  for (let month = 0; month < 12; month++) {
    docs.push({
      userId,
      tipo: "monotributo",
      descripcion: "AFIP - Monotributo",
      monto,
      fechaVencimiento: new Date(year, month, vencDay),
      estado: "pendiente",
    });
  }

  await Vencimiento.insertMany(docs);
}

// Asegura que existan los vencimientos monotributo del año solicitado
async function ensureVencimientosAnio(user, year) {
  if (!user.perfilCompleto || !user.cuit || !user.categoriaMonotributo) return;

  const yearStart = new Date(year, 0, 1);
  const yearEnd = new Date(year + 1, 0, 1);
  const count = await Vencimiento.countDocuments({
    userId: user._id,
    tipo: "monotributo",
    fechaVencimiento: { $gte: yearStart, $lt: yearEnd },
  });

  if (count === 0) {
    await generarVencimientosAnio(user._id, user.cuit, user.categoriaMonotributo, year);
  }
}

// GET /api/user/me — devuelve el usuario autenticado.
// Si tiene CUIL + categoría, asegura vencimientos del año actual.
router.get("/me", authMiddleware, async (req, res) => {
  try {
    await ensureVencimientosAnio(req.user, new Date().getFullYear());
  } catch (err) {
    console.error("Error asegurando vencimientos en /me:", err.message);
  }
  res.json({ user: req.user });
});

// PUT /api/user/profile — actualizar perfil (nombre, cuit, emailNotificaciones)
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { nombreCompleto, cuit, emailNotificaciones } = req.body;
    const user = req.user;

    if (nombreCompleto) user.nombreCompleto = nombreCompleto.trim();
    if (emailNotificaciones) user.emailNotificaciones = emailNotificaciones.trim();

    if (cuit && cuit.trim() && cuit.trim() !== user.cuit) {
      const oldCuit = user.cuit;
      user.cuit = cuit.trim();

      // TODO: Integrar con API real de AFIP
      const categoria = await ConfiguracionAfip.findOne({ categoria: "A" });
      if (categoria) {
        user.categoriaMonotributo = categoria.categoria;
        user.fechaInscripcion = user.fechaInscripcion || new Date();
      }

      user.perfilCompleto = true;
      await user.save();

      if (oldCuit && oldCuit !== user.cuit) {
        await Vencimiento.deleteMany({
          userId: user._id,
          tipo: "monotributo",
          estado: "pendiente",
        });
      }

      const currentYear = new Date().getFullYear();
      const existing = await Vencimiento.countDocuments({
        userId: user._id,
        tipo: "monotributo",
        fechaVencimiento: {
          $gte: new Date(currentYear, 0, 1),
          $lt: new Date(currentYear + 1, 0, 1),
        },
      });
      if (existing === 0) {
        await generarVencimientosAnio(user._id, user.cuit, user.categoriaMonotributo, currentYear);
      }

      return res.json({ user });
    }

    await user.save();
    res.json({ user });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "El CUIL ya está registrado por otro usuario" });
    }
    res.status(500).json({ message: "Error al actualizar perfil" });
  }
});

// GET /api/user/vencimientos — vencimientos del mes (monotributo + custom)
router.get("/vencimientos", authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;

    await ensureVencimientosAnio(user, year);

    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 1);
    const vencimientos = await Vencimiento.find({
      userId: user._id,
      fechaVencimiento: { $gte: monthStart, $lt: monthEnd },
    })
      .sort({ fechaVencimiento: 1 })
      .lean();

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const result = vencimientos.map((v) => {
      let estado = v.estado;

      if (v.tipo === "custom") {
        if (estado === "pagado" || estado === "al_dia") {
          estado = "al_dia";
        } else {
          estado = new Date(v.fechaVencimiento) < now ? "vencido" : "pendiente";
        }
      } else if (estado === "pagado" || estado === "al_dia") {
        estado = "al_dia";
      } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
        estado = "al_dia";
      } else if (year === currentYear && month === currentMonth) {
        const vencDay = new Date(v.fechaVencimiento).getDate();
        if (now.getDate() > vencDay + 2) estado = "al_dia";
        else if (now.getDate() > vencDay) estado = "vencido";
        else estado = "pendiente";
      } else {
        estado = "pendiente";
      }

      return {
        _id: v._id,
        tipo: v.tipo,
        titulo: v.titulo || "",
        descripcion: v.descripcion,
        monto: v.monto,
        fechaVencimiento: v.fechaVencimiento,
        estado,
        notificarEmail: !!v.notificarEmail,
        notificarSms: !!v.notificarSms,
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
    const { titulo, descripcion, monto, fechaVencimiento, notificarEmail, notificarSms, recurrente } = req.body;

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
      notificarSms: !!notificarSms,
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
