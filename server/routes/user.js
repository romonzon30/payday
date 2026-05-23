const router = require("express").Router();
const authMiddleware = require("../middleware/auth");
const ConfiguracionAfip = require("../models/ConfiguracionAfip");

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
      user.cuit = cuit.trim();

      // TODO: Integrar con API real de AFIP
      // Por ahora, asignamos categoría A como default al vincular CUIL
      const categoria = await ConfiguracionAfip.findOne({ categoria: "A" });
      if (categoria) {
        user.categoriaMonotributo = categoria.categoria;
        user.fechaInscripcion = user.fechaInscripcion || new Date();
      }

      user.perfilCompleto = true;
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

// GET /api/user/vencimientos — vencimientos mensuales del monotributo
router.get("/vencimientos", authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const month = parseInt(req.query.month) || new Date().getMonth() + 1; // 1-12

    if (!user.perfilCompleto || !user.cuit || !user.categoriaMonotributo) {
      return res.json({ vencimientos: [] });
    }

    // Calcular día de vencimiento según último dígito del CUIL
    const cuitClean = user.cuit.replace(/-/g, "");
    const lastDigit = parseInt(cuitClean.slice(-2, -1), 10);
    let vencDay;
    if (lastDigit <= 1) vencDay = 13;
    else if (lastDigit <= 3) vencDay = 15;
    else if (lastDigit <= 5) vencDay = 17;
    else if (lastDigit <= 7) vencDay = 19;
    else vencDay = 21;

    // Obtener monto de la categoría
    const config = await ConfiguracionAfip.findOne({ categoria: user.categoriaMonotributo });
    const monto = config ? config.montoMensual : 0;

    const now = new Date();
    const vencDate = new Date(year, month - 1, vencDay);

    let estado;
    if (vencDate < now) {
      // Fecha pasada: simulamos pagado si la diferencia es > 5 días
      const diffDays = Math.floor((now - vencDate) / (1000 * 60 * 60 * 24));
      estado = diffDays > 5 ? "al_dia" : "vencido";
    } else {
      // Fecha futura o hoy
      const diffDays = Math.floor((vencDate - now) / (1000 * 60 * 60 * 24));
      estado = diffDays <= 3 ? "pendiente" : "pendiente";
    }

    // Para meses anteriores al actual, marcar como al_dia
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      estado = "al_dia";
    }
    // Para el mes actual, si la fecha de vencimiento ya pasó y estamos > 2 días después
    if (year === currentYear && month === currentMonth && now.getDate() > vencDay + 2) {
      estado = "al_dia"; // Simulamos que pagó
    }
    // Si es el mes actual y falta poco
    if (year === currentYear && month === currentMonth && now.getDate() <= vencDay) {
      const daysLeft = vencDay - now.getDate();
      estado = daysLeft <= 3 ? "pendiente" : "pendiente";
    }

    const vencimientos = [
      {
        _id: `monotributo-${year}-${month}`,
        tipo: "monotributo",
        descripcion: "AFIP - Monotributo",
        monto,
        fechaVencimiento: vencDate.toISOString(),
        estado,
      },
    ];

    res.json({ vencimientos });
  } catch (err) {
    console.error("Error en /vencimientos:", err.message);
    res.status(500).json({ message: "Error al obtener vencimientos" });
  }
});

module.exports = router;
