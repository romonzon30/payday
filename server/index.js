// Entry point: connect to the DB, seed AFIP data, start the server and the
// notification scheduler.

const { env, isEmailConfigured, validateEnv } = require("./config/env");
const { connectDB, seedAfipCategorias } = require("./config/db");
const { createApp } = require("./app");
const { startNotificationScheduler } = require("./services/notificationScheduler");
const { verifyTransporter } = require("./services/emailService");

async function start() {
  validateEnv({ throwOnMissing: env.nodeEnv === "production" });

  await connectDB();
  await seedAfipCategorias();

  const app = createApp();

  app.listen(env.port, () => {
    console.log(`Servidor corriendo en puerto ${env.port}`);
    if (isEmailConfigured()) {
      verifyTransporter();
      startNotificationScheduler();
    } else {
      console.log("[NOTIF] SMTP no configurado, scheduler deshabilitado");
    }
  });
}

start().catch((err) => {
  console.error("Error al iniciar servidor:", err);
  process.exit(1);
});
