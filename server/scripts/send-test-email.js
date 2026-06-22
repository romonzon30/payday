// Envía un email de prueba usando la config SMTP real (emailService + .env).
// Uso:
//   node scripts/send-test-email.js destino@mail.com            -> envía los 3 tipos
//   node scripts/send-test-email.js destino@mail.com 24h        -> envía solo uno (48h | 24h | hoy)
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const { sendVencimientoEmail, verifyTransporter } = require("../services/emailService");

const to = process.argv[2];
const tipoArg = process.argv[3];

if (!to) {
  console.error("Falta el destinatario. Uso: node scripts/send-test-email.js destino@mail.com [48h|24h|hoy]");
  process.exit(1);
}

const tipos = tipoArg ? [tipoArg] : ["48h", "24h", "hoy"];

const vencimiento = {
  titulo: "AFIP - Monotributo",
  descripcion: "Vencimiento mensual de monotributo",
  monto: 56501.85,
  fechaVencimiento: new Date(Date.UTC(2026, 5, 22, 12, 0, 0)),
};

async function main() {
  console.log(`SMTP_HOST=${process.env.SMTP_HOST}  FROM=${process.env.SMTP_FROM || process.env.SMTP_USER}`);
  const ok = await verifyTransporter();
  if (!ok) {
    console.error("Conexión SMTP inválida. Revisá SMTP_HOST/USER/PASS en server/.env");
    process.exit(1);
  }
  for (const tipo of tipos) {
    const ok = await sendVencimientoEmail({ to, nombre: "Bautista Chehin", vencimiento, tipo });
    console.log(`-> ${tipo}: ${ok ? "ENVIADO" : "FALLÓ"}`);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
