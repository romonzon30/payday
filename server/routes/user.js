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

// GET /api/user/me — devuelve el usuario autenticado
router.get("/me", authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/user/profile — actualizar perfil (nombre, cuit, emailNotificaciones)
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const { nombreCompleto, cuit, emailNotificaciones } = req.body;
    const user = req.user;

    if (nombreCompleto) user.nombreCompleto = nombreCompleto.trim();
    if (emailNotificaciones) user.emailNotificaciones = emailNotificaciones.trim();

    // Si se agrega CUIL, consultar AFIP para obtener categoría
    if (cuit && cuit.trim() && cuit.trim() !== user.cuit) {
      const oldCuit = user.cuit;
      user.cuit = cuit.trim();

      // TODO: Integrar con API real de AFIP
      // Por ahora, asignamos categoría A como default al vincular CUIL
      const categoria = await ConfiguracionAfip.findOne({ categoria: "A" });
      if (categoria) {
        user.categoriaMonotributo = categoria.categoria;
        user.fechaInscripcion = user.fechaInscripcion || new Date();
      }

      user.perfilCompleto = true;
      await user.save();

      // Si cambió el CUIL, eliminar vencimientos futuros pendientes y regenerar
      if (oldCuit && oldCuit !== user.cuit) {
        await Vencimiento.deleteMany({ userId: user._id, estado: "pendiente" });
      }

      // Generar vencimientos para el año actual (si no existen)
      const currentYear = new Date().getFullYear();
      const existing = await Vencimiento.countDocuments({
        userId: user._id,
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

// GET /api/user/vencimientos — vencimientos mensuales del monotributo (desde DB)
router.get("/vencimientos", authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1; // 1-12

    if (!user.perfilCompleto || !user.cuit || !user.categoriaMonotributo) {
      return res.json({ vencimientos: [] });
    }

    // Lazy renewal: si no hay vencimientos para el año solicitado, generarlos
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year + 1, 0, 1);
    const countYear = await Vencimiento.countDocuments({
      userId: user._id,
      fechaVencimiento: { $gte: yearStart, $lt: yearEnd },
    });

    if (countYear === 0) {
      await generarVencimientosAnio(user._id, user.cuit, user.categoriaMonotributo, year);
    }

    // Consultar vencimientos del mes solicitado
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 1);
    const vencimientos = await Vencimiento.find({
      userId: user._id,
      fechaVencimiento: { $gte: monthStart, $lt: monthEnd },
    }).lean();

    // Computar estado dinámicamente
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const result = vencimientos.map((v) => {
      let estado = v.estado;

      // Si fue marcado como pagado, mantenerlo
      if (estado === "pagado" || estado === "al_dia") {
        estado = "al_dia";
      } else {
        // Meses anteriores al actual → al_dia (simulado)
        if (year < currentYear || (year === currentYear && month < currentMonth)) {
          estado = "al_dia";
        }
        // Mes actual: si la fecha de vencimiento pasó hace > 2 días → al_dia (simulado)
        else if (year === currentYear && month === currentMonth) {
          const vencDay = v.fechaVencimiento.getDate();
          if (now.getDate() > vencDay + 2) {
            estado = "al_dia";
          } else if (now.getDate() > vencDay) {
            estado = "vencido";
          } else {
            estado = "pendiente";
          }
        }
        // Meses futuros → pendiente
        else {
          estado = "pendiente";
        }
      }

      return {
        _id: v._id,
        tipo: v.tipo,
        descripcion: v.descripcion,
        monto: v.monto,
        fechaVencimiento: v.fechaVencimiento,
        estado,
      };
    });

    res.json({ vencimientos: result });
  } catch (err) {
    console.error("Error en /vencimientos:", err.message);
    res.status(500).json({ message: "Error al obtener vencimientos" });
  }
});

module.exports = router;
