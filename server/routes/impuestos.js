const router = require("express").Router();
const authMiddleware = require("../middleware/auth");
const User = require("../models/User");
const Vencimiento = require("../models/Vencimiento");
const { IMPUESTOS } = require("../data/taxCalendar2026");
const { adjustToNextBusinessDayUTC } = require("../domain/businessDays");
const { parseCuitLastDigit, getGrupoForDigit } = require("../domain/taxCalendar");

// ── Routes ───────────────────────────────────────────────────

// GET /api/impuestos/preview?year=2026&month=5  (month is 0-indexed)
router.get("/preview", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    const now = new Date();
    const year = parseInt(req.query.year) || now.getUTCFullYear();
    const month = req.query.month !== undefined ? parseInt(req.query.month) : now.getUTCMonth();

    const lastDigit = parseCuitLastDigit(user.cuit);

    const monthStart = new Date(Date.UTC(year, month, 1));
    const monthEnd   = new Date(Date.UTC(year, month + 1, 1));

    // Find already-added vencimientos for this month (non-monotributo)
    const existing = await Vencimiento.find({
      userId: user._id,
      tipo: { $in: IMPUESTOS.map((i) => i.id) },
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

    res.json({ impuestos, cuitUltimoDigito: lastDigit, anio: year, mes: month });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener preview" });
  }
});

// POST /api/impuestos/agregar
router.post("/agregar", authMiddleware, async (req, res) => {
  try {
    const { impuestoId, year, month, monto, notificarEmail = true, periodico = false } = req.body;

    // ── Validate monto ─────────────────────────────────────
    const montoNum = parseFloat(monto);
    if (!monto || isNaN(montoNum) || montoNum <= 0) {
      return res.status(400).json({ error: "El monto debe ser mayor a $0" });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

    const imp = IMPUESTOS.find((i) => i.id === impuestoId);
    if (!imp) return res.status(400).json({ error: "Impuesto no válido" });

    const lastDigit = parseCuitLastDigit(user.cuit);
    const grupo = getGrupoForDigit(imp, lastDigit);
    const now = new Date();

    // ── Periodic: create for all remaining months of the year ─
    if (periodico) {
      const created = [];
      for (let m = month; m <= 11; m++) {
        const fecha = adjustToNextBusinessDayUTC(year, m, grupo.baseDia);
        if (fecha <= now) continue; // skip months already passed

        const mStart = new Date(Date.UTC(year, m, 1));
        const mEnd   = new Date(Date.UTC(year, m + 1, 1));
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
      if (created.length === 0) {
        return res.status(400).json({ error: "No hay meses futuros disponibles para agregar" });
      }
      return res.status(201).json({ vencimientos: created, count: created.length });
    }

    // ── Single month ────────────────────────────────────────
    const fechaVencimiento = adjustToNextBusinessDayUTC(year, month, grupo.baseDia);

    // Validate date is in the future
    if (fechaVencimiento <= now) {
      return res.status(400).json({ error: "La fecha de vencimiento ya pasó. Seleccioná un mes futuro o usá la opción periódica." });
    }

    const monthStart = new Date(Date.UTC(year, month, 1));
    const monthEnd   = new Date(Date.UTC(year, month + 1, 1));

    const existing = await Vencimiento.findOne({
      userId: user._id,
      tipo: imp.id,
      fechaVencimiento: { $gte: monthStart, $lt: monthEnd },
    });
    if (existing) return res.status(409).json({ error: "Ya existe este vencimiento para este mes" });

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

    res.status(201).json({ vencimiento });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al agregar vencimiento" });
  }
});

// DELETE /api/impuestos/:vencimientoId
router.delete("/:vencimientoId", authMiddleware, async (req, res) => {
  try {
    const v = await Vencimiento.findOneAndDelete({
      _id: req.params.vencimientoId,
      userId: req.user.id,
      tipo: { $in: IMPUESTOS.map((i) => i.id) },
    });
    if (!v) return res.status(404).json({ error: "Vencimiento no encontrado" });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: "Error al eliminar" });
  }
});

module.exports = router;
