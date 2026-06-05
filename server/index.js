const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, ".env") });

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const impuestosRoutes = require("./routes/impuestos");
const ConfiguracionAfip = require("./models/ConfiguracionAfip");
const { startNotificationScheduler } = require("./services/notificationScheduler");

const categoriasAfip = [
  { categoria: "A", montoMensual: 42386.74, incluyeObraSocial: false, incluyeJubilacion: false, limiteFacturacion: 748382.07,   costoPorCarga: 0 },
  { categoria: "B", montoMensual: 48250.78, incluyeObraSocial: false, incluyeJubilacion: false, limiteFacturacion: 1122573.10,  costoPorCarga: 0 },
  { categoria: "C", montoMensual: 56501.85, incluyeObraSocial: true,  incluyeJubilacion: true,  limiteFacturacion: 1870955.17,  costoPorCarga: 12500 },
  { categoria: "D", montoMensual: 72414.10, incluyeObraSocial: true,  incluyeJubilacion: true,  limiteFacturacion: 2806432.76,  costoPorCarga: 14000 },
  { categoria: "E", montoMensual: 102537.97, incluyeObraSocial: true, incluyeJubilacion: true,  limiteFacturacion: 3741910.34,  costoPorCarga: 18000 },
  { categoria: "F", montoMensual: 129045.32, incluyeObraSocial: true, incluyeJubilacion: true,  limiteFacturacion: 4677387.93,  costoPorCarga: 22000 },
  { categoria: "G", montoMensual: 197108.23, incluyeObraSocial: true, incluyeJubilacion: true,  limiteFacturacion: 5612865.51,  costoPorCarga: 32000 },
  { categoria: "H", montoMensual: 447346.93, incluyeObraSocial: true, incluyeJubilacion: true,  limiteFacturacion: 6548343.10,  costoPorCarga: 65000 },
  { categoria: "I", montoMensual: 824802.26, incluyeObraSocial: true, incluyeJubilacion: true,  limiteFacturacion: 9354758.68,  costoPorCarga: 110000 },
  { categoria: "J", montoMensual: 999007.65, incluyeObraSocial: true, incluyeJubilacion: true,  limiteFacturacion: 11241282.00, costoPorCarga: 135000 },
  { categoria: "K", montoMensual: 1381687.90, incluyeObraSocial: true, incluyeJubilacion: true, limiteFacturacion: 15000000.00, costoPorCarga: 175000 },
]
 
async function seedCategorias() {
  for (const categoriaData of categoriasAfip) {
    await ConfiguracionAfip.updateOne(
      { categoria: categoriaData.categoria },
      {
        $set: {
          montoMensual: categoriaData.montoMensual,
          incluyeObraSocial: categoriaData.incluyeObraSocial,
          incluyeJubilacion: categoriaData.incluyeJubilacion,
          limiteFacturacion: categoriaData.limiteFacturacion,
          costoPorCarga: categoriaData.costoPorCarga,
          vigenciaDesde: new Date("2025-01-01"),
          vigenciaHasta: null,
        },
      },
      { upsert: true }
    );
  }
  console.log(`Seed: ${categoriasAfip.length} categorías AFIP actualizadas/insertadas`);
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
  app.use("/api/impuestos", impuestosRoutes);

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
