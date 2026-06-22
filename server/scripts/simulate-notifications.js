// Simula el sistema completo de notificaciones "como si fuera hoy".
//
// Levanta una Mongo EN MEMORIA (no toca Atlas ni datos reales), siembra un user
// con 3 vencimientos en las 3 ventanas (48h / 24h / hoy) y corre el scheduler
// REAL contra SMTP REAL: vas a recibir los 3 emails de verdad.
//
// Uso:
//   node scripts/simulate-notifications.js destino@mail.com
//
// Nota (Resend sandbox): onboarding@resend.dev solo entrega al dueño de la
// cuenta. Para recibir los mails, usá esa casilla o un dominio verificado.
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

const to = process.argv[2];
if (!to) {
  console.error("Falta el destinatario. Uso: node scripts/simulate-notifications.js destino@mail.com");
  process.exit(1);
}

const inHours = (h) => new Date(Date.now() + h * 3600 * 1000);

async function main() {
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  // Requerir después de conectar: usan la conexión mongoose compartida.
  const User = require("../models/User");
  const Vencimiento = require("../models/Vencimiento");
  const Notificacion = require("../models/Notificacion");
  const { verifyTransporter } = require("../services/emailService");
  const { checkAndNotify } = require("../services/notificationScheduler");

  console.log(`SMTP_HOST=${process.env.SMTP_HOST}  FROM=${process.env.SMTP_FROM || process.env.SMTP_USER}  TO=${to}`);
  const smtpOk = await verifyTransporter();
  if (!smtpOk) {
    console.error("Conexión SMTP inválida. Revisá SMTP_HOST/USER/PASS en server/.env");
    await mongod.stop();
    process.exit(1);
  }

  const user = await User.create({
    googleUid: `sim-${new mongoose.Types.ObjectId()}`,
    email: to,
    emailNotificaciones: to,
    nombreCompleto: "Simulación PayDay",
  });

  const base = {
    userId: user._id,
    tipo: "monotributo",
    descripcion: "AFIP - Monotributo",
    monto: 56501.85,
    estado: "pendiente",
    notificarEmail: true,
  };
  const ventanas = [
    { label: "7d", fechaVencimiento: inHours(156) },
    { label: "48h", fechaVencimiento: inHours(36) },
    { label: "24h", fechaVencimiento: inHours(12) },
    { label: "hoy", fechaVencimiento: inHours(-1) },
  ];
  const seeded = [];
  for (const v of ventanas) {
    seeded.push(await Vencimiento.create({ ...base, titulo: `Test ${v.label}`, fechaVencimiento: v.fechaVencimiento }));
  }

  console.log("\nCorriendo checkAndNotify()...\n");
  await checkAndNotify();

  console.log("Resultado por vencimiento:");
  for (const s of seeded) {
    const f = await Vencimiento.findById(s._id);
    console.log(
      `  ${f.titulo.padEnd(10)} estado=${f.estado.padEnd(10)} ` +
        `7d=${f.notif7dEnviada} 48h=${f.notif48hEnviada} 24h=${f.notif24hEnviada} vencido=${f.notifVencidoEnviada}`,
    );
  }

  const notifs = await Notificacion.find({ userId: user._id }).lean();
  console.log(`\nNotificaciones in-app creadas: ${notifs.length}`);
  for (const n of notifs) console.log(`  - [${n.tipo}] ${n.titulo}`);

  await mongoose.disconnect();
  await mongod.stop();
  console.log("\nListo. DB en memoria descartada.");
  process.exit(0);
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
