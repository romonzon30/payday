const cron = require("node-cron");
const Vencimiento = require("../models/Vencimiento");
const Notificacion = require("../models/Notificacion");
const User = require("../models/User");
const { sendVencimientoEmail } = require("../services/emailService");

async function checkAndNotify() {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  try {
    // 1) Vencimientos que vencen en las próximas 48h (pero más de 24h) — notif 48h
    const venc48h = await Vencimiento.find({
      estado: "pendiente",
      notif48hEnviada: false,
      notificarEmail: true,
      fechaVencimiento: { $gt: in24h, $lte: in48h },
    }).lean();

    for (const v of venc48h) {
      const user = await User.findById(v.userId).lean();
      if (!user) continue;

      const sent = await sendVencimientoEmail({
        to: user.email,
        vencimiento: v,
        tipo: "48h",
      });

      if (sent) {
        await Vencimiento.updateOne({ _id: v._id }, { notif48hEnviada: true });
        await Notificacion.create({
          userId: v.userId,
          tipo: "recordatorio",
          titulo: `Vencimiento en 48hs: ${v.titulo || v.descripcion}`,
          cuerpo: `Tu pago "${v.titulo || v.descripcion}" vence el ${new Date(v.fechaVencimiento).toLocaleDateString("es-AR")}`,
          canal: "email",
          refId: v._id,
        });
      }
    }

    // 2) Vencimientos que vencen en las próximas 24h — notif 24h
    const venc24h = await Vencimiento.find({
      estado: "pendiente",
      notif24hEnviada: false,
      notificarEmail: true,
      fechaVencimiento: { $gt: now, $lte: in24h },
    }).lean();

    for (const v of venc24h) {
      const user = await User.findById(v.userId).lean();
      if (!user) continue;

      const sent = await sendVencimientoEmail({
        to: user.email,
        vencimiento: v,
        tipo: "24h",
      });

      if (sent) {
        await Vencimiento.updateOne(
          { _id: v._id },
          { notif24hEnviada: true, notif48hEnviada: true }
        );
        await Notificacion.create({
          userId: v.userId,
          tipo: "recordatorio",
          titulo: `Vencimiento en 24hs: ${v.titulo || v.descripcion}`,
          cuerpo: `Tu pago "${v.titulo || v.descripcion}" vence mañana`,
          canal: "email",
          refId: v._id,
        });
      }
    }

    // 3) Vencimientos que ya pasaron la fecha y no se pagaron — notif vencido
    const vencVencidos = await Vencimiento.find({
      estado: "pendiente",
      notifVencidoEnviada: false,
      notificarEmail: true,
      fechaVencimiento: { $lt: now },
    }).lean();

    for (const v of vencVencidos) {
      const user = await User.findById(v.userId).lean();
      if (!user) continue;

      const sent = await sendVencimientoEmail({
        to: user.email,
        vencimiento: v,
        tipo: "vencido",
      });

      if (sent) {
        await Vencimiento.updateOne(
          { _id: v._id },
          { notifVencidoEnviada: true, estado: "vencido" }
        );
        await Notificacion.create({
          userId: v.userId,
          tipo: "alerta",
          titulo: `Vencimiento pasado: ${v.titulo || v.descripcion}`,
          cuerpo: `Tu pago "${v.titulo || v.descripcion}" venció el ${new Date(v.fechaVencimiento).toLocaleDateString("es-AR")}`,
          canal: "email",
          refId: v._id,
        });
      }
    }

    const total = venc48h.length + venc24h.length + vencVencidos.length;
    if (total > 0) {
      console.log(
        `[NOTIF] Procesados: ${venc48h.length} (48h), ${venc24h.length} (24h), ${vencVencidos.length} (vencidos)`
      );
    }
  } catch (err) {
    console.error("[NOTIF] Error en checkAndNotify:", err.message);
  }
}

function startNotificationScheduler() {
  // Ejecutar cada hora
  cron.schedule("0 * * * *", () => {
    console.log("[NOTIF] Ejecutando check de notificaciones...");
    checkAndNotify();
  });

  console.log("[NOTIF] Scheduler de notificaciones iniciado (cada 1 hora)");

  // Ejecutar una vez al iniciar
  checkAndNotify();
}

module.exports = { startNotificationScheduler, checkAndNotify };
