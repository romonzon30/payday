const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, ".env") });

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const ConfiguracionAfip = require("./models/ConfiguracionAfip");
const { startNotificationScheduler } = require("./services/notificationScheduler");

const categoriasAfip = [
  { categoria: "A", montoMensual: 1867.5, incluyeObraSocial: false, incluyeJubilacion: false, limiteFacturacion: 748382.07 },
  { categoria: "B", montoMensual: 2215.3, incluyeObraSocial: false, incluyeJubilacion: false, limiteFacturacion: 1122573.1 },
  { categoria: "C", montoMensual: 3659.07, incluyeObraSocial: true, incluyeJubilacion: true, limiteFacturacion: 1870955.17 },
  { categoria: "D", montoMensual: 7947.2, incluyeObraSocial: true, incluyeJubilacion: true, limiteFacturacion: 2806432.76 },
  { categoria: "E", montoMensual: 10158.75, incluyeObraSocial: true, incluyeJubilacion: true, limiteFacturacion: 3741910.34 },
]
 
async function seedCategorias() {
  const count = await ConfiguracionAfip.countDocuments();
  if (count === 0) {
    const docs = categoriasAfip.map((cat) => ({
      ...cat,
      vigenciaDesde: new Date("2025-01-01"),
      vigenciaHasta: null,
    }));
    await ConfiguracionAfip.insertMany(docs);
    console.log(`Seed: ${docs.length} categorías AFIP insertadas`);
  }
}

async function start() {
  const port = Number(process.env.PORT) || 5000;
  const allowedOrigins = (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  let connected = false;

  if (process.env.MONGO_URI) {
    try {
      await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
      console.log("MongoDB Atlas conectado");
      connected = true;
    } catch (err) {
      console.warn("Atlas no disponible, usando memoria:", err.message);
    }
  }

  if (!connected) {
    try {
      const { MongoMemoryServer } = require("mongodb-memory-server");
      const mongod = await MongoMemoryServer.create({ instance: { port: 27018, dbName: "monotributo_saas" } });
      await mongoose.connect(mongod.getUri());
      console.log("MongoDB Memory conectado en:", mongod.getUri());
    } catch {
      console.error("MONGO_URI no definida y mongodb-memory-server no disponible. Abortando.");
      process.exit(1);
    }
  }

  await seedCategorias();

  const app = express();
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        return callback(new Error("CORS blocked"));
      },
    })
  );
  app.use(express.json());
  app.use("/api/auth", authRoutes);
  app.use("/api/user", userRoutes);

  app.listen(port, () => {
    console.log(`Servidor corriendo en puerto ${port}`);
    if (process.env.SMTP_HOST) {
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
