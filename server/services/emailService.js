const nodemailer = require("nodemailer");
const { env } = require("../config/env");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: {
      user: env.smtp.user,
      pass: env.smtp.pass,
    },
  });

  return transporter;
}

// Validates the SMTP connection/credentials without sending mail.
// Returns true on success, false (and logs) on failure.
async function verifyTransporter() {
  try {
    await getTransporter().verify();
    console.log("[EMAIL] Conexión SMTP verificada");
    return true;
  } catch (err) {
    console.error("[EMAIL] Verificación SMTP falló:", err.message);
    return false;
  }
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
  return "$ " + Number(monto || 0).toLocaleString("es-AR", { minimumFractionDigits: 0 });
}

// Devuelve solo el primer nombre para el saludo ("Juan Pérez" -> "Juan")
function primerNombre(nombreCompleto) {
  if (!nombreCompleto || !nombreCompleto.trim()) return "";
  return nombreCompleto.trim().split(/\s+/)[0];
}

// Configuración visual y de copy por tipo de aviso
const TIPOS = {
  "48h": {
    color: "#f59e0b",
    icon: "⏰",
    titulo: "Tu vencimiento se acerca",
    mensaje: "Faltan <strong>48 horas</strong> para el vencimiento.",
    subject: (nombre) => `⏰ Faltan 48 horas para tu vencimiento: ${nombre}`,
  },
  "24h": {
    color: "#f97316",
    icon: "⚠️",
    titulo: "Tu vencimiento es mañana",
    mensaje: "Falta <strong>24 horas</strong> para el vencimiento.",
    subject: (nombre) => `⚠️ Faltan 24 horas para tu vencimiento: ${nombre}`,
  },
  hoy: {
    color: "#f97316",
    icon: "📅",
    titulo: "Tu pago vence hoy",
    mensaje: "Hoy es la <strong>fecha límite</strong> de pago de tu vencimiento.",
    subject: (nombre) => `Tu pago vence hoy: ${nombre}`,
  },
};

function buildEmailHtml({ nombre, impuesto, descripcion, monto, fechaVencimiento, tipo }) {
  const cfg = TIPOS[tipo] || TIPOS.hoy;
  const fecha = formatDate(fechaVencimiento);
  const montoStr = formatMonto(monto);
  const saludoNombre = primerNombre(nombre);
  const saludo = saludoNombre ? `Hola ${saludoNombre},` : "Hola,";

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
      <div style="background: #0f172a; border-radius: 16px; padding: 32px; color: #e2e8f0;">
        <div style="text-align: center; margin-bottom: 24px;">
          <span style="font-size: 40px;">${cfg.icon}</span>
        </div>
        <h1 style="color: white; font-size: 20px; text-align: center; margin: 0 0 8px;">
          ${cfg.titulo}
        </h1>
        <p style="text-align: center; color: ${cfg.color}; font-size: 14px; font-weight: 600; margin: 0 0 24px;">
          ${cfg.mensaje}
        </p>
        <p style="font-size: 15px; color: #e2e8f0; margin: 0 0 16px;">
          ${saludo}
        </p>
        <p style="font-size: 14px; color: #94a3b8; margin: 0 0 20px;">
          Te recordamos que tenés el siguiente vencimiento registrado en PayDay:
        </p>
        <div style="background: rgba(255,255,255,0.06); border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <p style="margin: 0 0 4px; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: .04em;">
            Impuesto
          </p>
          <p style="margin: 0 0 16px; font-size: 17px; font-weight: 700; color: white;">
            ${impuesto || descripcion}
          </p>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Monto</td>
              <td style="padding: 6px 0; text-align: right; color: white; font-weight: 700;">${montoStr}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #94a3b8;">Fecha de vencimiento</td>
              <td style="padding: 6px 0; text-align: right; color: white; font-weight: 700;">${fecha}</td>
            </tr>
          </table>
        </div>
        <p style="text-align: center; font-size: 12px; color: #64748b; margin: 0;">
          PayDay — Tu asistente de vencimientos
        </p>
      </div>
    </div>
  `;
}

// Versión texto plano (mejora la entregabilidad: un mail solo-HTML puntúa peor en spam)
function buildEmailText({ nombre, impuesto, descripcion, monto, fechaVencimiento, tipo }) {
  const cfg = TIPOS[tipo] || TIPOS.hoy;
  const saludoNombre = primerNombre(nombre);
  const saludo = saludoNombre ? `Hola ${saludoNombre},` : "Hola,";
  const linea = cfg.mensaje.replace(/<[^>]+>/g, "");

  return [
    saludo,
    "",
    "Te recordamos que tenés el siguiente vencimiento registrado en PayDay:",
    "",
    `Impuesto: ${impuesto || descripcion}`,
    `Monto: ${formatMonto(monto)}`,
    `Fecha de vencimiento: ${formatDate(fechaVencimiento)}`,
    "",
    linea,
    "",
    "— PayDay, tu asistente de vencimientos",
  ].join("\n");
}

async function sendVencimientoEmail({ to, nombre, vencimiento, tipo }) {
  const cfg = TIPOS[tipo] || TIPOS.hoy;
  const nombreImpuesto = vencimiento.titulo || vencimiento.descripcion;

  const datos = {
    nombre,
    impuesto: vencimiento.titulo,
    descripcion: vencimiento.descripcion,
    monto: vencimiento.monto,
    fechaVencimiento: vencimiento.fechaVencimiento,
    tipo,
  };

  const html = buildEmailHtml(datos);
  const text = buildEmailText(datos);

  const mail = {
    from: env.smtp.from,
    to,
    subject: cfg.subject(nombreImpuesto),
    html,
    text,
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

module.exports = { sendVencimientoEmail, verifyTransporter };
