// Database connection and AFIP seeding.

const mongoose = require("mongoose");
const { env } = require("./env");
const ConfiguracionAfip = require("../models/ConfiguracionAfip");
const { CATEGORIAS_AFIP } = require("../data/afipCategorias");

// Connects to Atlas (MONGO_URI), falling back to an in-memory server for local
// dev. Exits the process if neither is reachable.
async function connectDB() {
  if (env.mongoUri) {
    try {
      await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
      console.log("MongoDB Atlas conectado");
      return;
    } catch (err) {
      console.warn("Atlas no disponible, usando memoria:", err.message);
    }
  }

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

// Upserts the AFIP category table so the app always has pricing data.
async function seedAfipCategorias() {
  for (const cat of CATEGORIAS_AFIP) {
    await ConfiguracionAfip.updateOne(
      { categoria: cat.categoria },
      {
        $set: {
          montoMensual: cat.montoMensual,
          incluyeObraSocial: cat.incluyeObraSocial,
          incluyeJubilacion: cat.incluyeJubilacion,
          limiteFacturacion: cat.limiteFacturacion,
          costoPorCarga: cat.costoPorCarga,
          vigenciaDesde: new Date("2025-01-01"),
          vigenciaHasta: null,
        },
      },
      { upsert: true }
    );
  }
  console.log(`Seed: ${CATEGORIAS_AFIP.length} categorías AFIP actualizadas/insertadas`);
}

module.exports = { connectDB, seedAfipCategorias };
