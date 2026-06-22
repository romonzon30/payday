const cron = require("node-cron");
const Vencimiento = require("../models/Vencimiento");
const Notificacion = require("../models/Notificacion");
const User = require("../models/User");
const { sendVencimientoEmail } = require("../services/emailService");

// Prevents overlapping runs within this process (cron tick + boot run, or a run
// that spills past the hour). Cross-process safety comes from the atomic claim below.
let running = false;

// Atomically claims a vencimiento by flipping `claimField` false->true BEFORE
// sending, so two concurrent runs (or instances) can never both email the same
// row. On a send failure the claim is reverted so the next run retries; on
// success any cascading flags / estado in `onSent` are applied and the in-app
// notification is recorded. Returns true when an email was actually sent.
async function claimSendNotify({ v, claimField, tipo, onSent, notif }) {
  // $ne:true (no :false) para claimear también docs donde el flag aún no existe
  // (campos de notificación agregados después de crearse el vencimiento).
  const claimed = await Vencimiento.findOneAndUpdate(
    { _id: v._id, [claimField]: { $ne: true } },
    { $set: { [claimField]: true } }
  );
  if (!claimed) return false; // another run already claimed it

  const revert = () => Vencimiento.updateOne({ _id: v._id }, { $set: { [claimField]: false } });

  const user = await User.findById(v.userId).lean();
  if (!user) {
    await revert();
    return false;
  }

  const sent = await sendVencimientoEmail({
    to: user.emailNotificaciones || user.email,
    nombre: user.nombreCompleto,
    vencimiento: v,
    tipo,
  });

  if (!sent) {
    await revert();
    return false;
  }

  if (onSent) await Vencimiento.updateOne({ _id: v._id }, { $set: onSent });
  await Notificacion.create(notif);
  return true;
}

async function checkAndNotify() {
  if (running) return;
  running = true;

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const in6d = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000);
  const in7d = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  let sent7 = 0;
  let sent48 = 0;
  let sent24 = 0;
  let sentHoy = 0;

  try {
    // 0) Vencen en 6-7 días — recordatorio 7 días
    // $ne:true (no :false) para alcanzar también los docs creados antes de
    // existir este campo, donde notif7dEnviada está ausente.
    const venc7d = await Vencimiento.find({
      estado: "pendiente",
      notif7dEnviada: { $ne: true },
      notificarEmail: true,
      fechaVencimiento: { $gt: in6d, $lte: in7d },
    }).lean();

    for (const v of venc7d) {
      const ok = await claimSendNotify({
        v,
        claimField: "notif7dEnviada",
        tipo: "7d",
        notif: {
          userId: v.userId,
          tipo: "recordatorio",
          titulo: `Vencimiento en 7 días: ${v.titulo || v.descripcion}`,
          cuerpo: `Tu pago "${v.titulo || v.descripcion}" vence el ${new Date(v.fechaVencimiento).toLocaleDateString("es-AR")}`,
          canal: "email",
          refId: v._id,
        },
      });
      if (ok) sent7++;
    }

    // 1) Vencen en 24-48h — recordatorio 48h
    const venc48h = await Vencimiento.find({
      estado: "pendiente",
      notif48hEnviada: false,
      notificarEmail: true,
      fechaVencimiento: { $gt: in24h, $lte: in48h },
    }).lean();

    for (const v of venc48h) {
      const ok = await claimSendNotify({
        v,
        claimField: "notif48hEnviada",
        tipo: "48h",
        onSent: { notif7dEnviada: true },
        notif: {
          userId: v.userId,
          tipo: "recordatorio",
          titulo: `Vencimiento en 48hs: ${v.titulo || v.descripcion}`,
          cuerpo: `Tu pago "${v.titulo || v.descripcion}" vence el ${new Date(v.fechaVencimiento).toLocaleDateString("es-AR")}`,
          canal: "email",
          refId: v._id,
        },
      });
      if (ok) sent48++;
    }

    // 2) Vencen en las próximas 24h — recordatorio 24h
    const venc24h = await Vencimiento.find({
      estado: "pendiente",
      notif24hEnviada: false,
      notificarEmail: true,
      fechaVencimiento: { $gt: now, $lte: in24h },
    }).lean();

    for (const v of venc24h) {
      const ok = await claimSendNotify({
        v,
        claimField: "notif24hEnviada",
        tipo: "24h",
        onSent: { notif7dEnviada: true, notif48hEnviada: true },
        notif: {
          userId: v.userId,
          tipo: "recordatorio",
          titulo: `Vencimiento en 24hs: ${v.titulo || v.descripcion}`,
          cuerpo: `Tu pago "${v.titulo || v.descripcion}" vence mañana`,
          canal: "email",
          refId: v._id,
        },
      });
      if (ok) sent24++;
    }

    // 3) Vence hoy / plazo cumplido — alerta y paso a "vencido"
    const vencHoy = await Vencimiento.find({
      estado: "pendiente",
      notifVencidoEnviada: false,
      notificarEmail: true,
      fechaVencimiento: { $lte: now },
    }).lean();

    for (const v of vencHoy) {
      const ok = await claimSendNotify({
        v,
        claimField: "notifVencidoEnviada",
        tipo: "hoy",
        onSent: { notif7dEnviada: true, notif24hEnviada: true, notif48hEnviada: true, estado: "vencido" },
        notif: {
          userId: v.userId,
          tipo: "alerta",
          titulo: `Hoy vence: ${v.titulo || v.descripcion}`,
          cuerpo: `Tu pago "${v.titulo || v.descripcion}" vence hoy ${new Date(v.fechaVencimiento).toLocaleDateString("es-AR")}`,
          canal: "email",
          refId: v._id,
        },
      });
      if (ok) sentHoy++;
    }

    if (sent7 + sent48 + sent24 + sentHoy > 0) {
      console.log(`[NOTIF] Enviados: ${sent7} (7d), ${sent48} (48h), ${sent24} (24h), ${sentHoy} (vence hoy)`);
    }
  } catch (err) {
    console.error("[NOTIF] Error en checkAndNotify:", err.message);
  } finally {
    running = false;
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
