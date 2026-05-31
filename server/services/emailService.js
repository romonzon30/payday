const nodemailer = require("nodemailer");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

function formatDate(date) {
  return new Date(date).toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatMonto(monto) {
  return "$ " + monto.toLocaleString("es-AR", { minimumFractionDigits: 0 });
}

function buildEmailHtml({ titulo, descripcion, monto, fechaVencimiento, tipo }) {
  const fecha = formatDate(fechaVencimiento);
  const montoStr = formatMonto(monto);

  let color, icon, mensaje;
  if (tipo === "48h") {
    color = "#f59e0b";
    icon = "⏰";
    mensaje = "Faltan <strong>48 horas</strong> para el vencimiento";
  } else if (tipo === "24h") {
    color = "#f97316";
    icon = "⚠️";
    mensaje = "Faltan <strong>24 horas</strong> para el vencimiento";
  } else {
    color = "#ef4444";
    icon = "🚨";
    mensaje = "El pago se encuentra <strong>vencido</strong>";
  }

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
      <div style="background: #0f172a; border-radius: 16px; padding: 32px; color: #e2e8f0;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 40px;">${icon}</span>
        </div>
        <h1 style="color: white; font-size: 20px; text-align: center; margin: 0 0 8px;">
          Recordatorio de vencimiento
        </h1>
        <p style="text-align: center; color: ${color}; font-size: 14px; font-weight: 600; margin: 0 0 24px;">
          ${mensaje}
        </p>
        <div style="background: rgba(255,255,255,0.06); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <p style="margin: 0 0 8px; font-size: 16px; font-weight: 700; color: white;">
            ${titulo || descripcion}
          </p>
          <p style="margin: 0 0 12px; font-size: 13px; color: #94a3b8;">
            ${descripcion}
          </p>
          <div style="display: flex; justify-content: space-between; font-size: 14px;">
            <span style="color: #94a3b8;">Fecha: <strong style="color: white;">${fecha}</strong></span>
          </div>
          <div style="margin-top: 8px; font-size: 14px;">
            <span style="color: #94a3b8;">Monto: <strong style="color: white;">${montoStr}</strong></span>
          </div>
        </div>
        <p style="text-align: center; font-size: 12px; color: #64748b; margin: 0;">
          PayDay — Tu asistente de vencimientos
        </p>
      </div>
    </div>
  `;
}

async function sendVencimientoEmail({ to, vencimiento, tipo }) {
  const subjects = {
    "48h": `⏰ Vencimiento en 48hs: ${vencimiento.titulo || vencimiento.descripcion}`,
    "24h": `⚠️ Vencimiento en 24hs: ${vencimiento.titulo || vencimiento.descripcion}`,
    vencido: `🚨 Vencimiento pasado: ${vencimiento.titulo || vencimiento.descripcion}`,
  };

  const html = buildEmailHtml({
    titulo: vencimiento.titulo,
    descripcion: vencimiento.descripcion,
    monto: vencimiento.monto,
    fechaVencimiento: vencimiento.fechaVencimiento,
    tipo,
  });

  const mail = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject: subjects[tipo],
    html,
  };

  try {
    const info = await getTransporter().sendMail(mail);
    console.log(`[EMAIL] Enviado (${tipo}) a ${to}: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error(`[EMAIL] Error enviando (${tipo}) a ${to}:`, err.message);
    return false;
  }
}

module.exports = { sendVencimientoEmail };
