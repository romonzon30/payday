const mongoose = require("mongoose");
require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const ConfiguracionAfip = require("./models/ConfiguracionAfip");

const categoriasAfip = [
  { categoria: "A", montoMensual: 42386.74, incluyeObraSocial: false, incluyeJubilacion: false, limiteFacturacion: 748382.07 },
  { categoria: "B", montoMensual: 48250.78, incluyeObraSocial: false, incluyeJubilacion: false, limiteFacturacion: 1122573.10 },
  { categoria: "C", montoMensual: 56501.85, incluyeObraSocial: true, incluyeJubilacion: true, limiteFacturacion: 1870955.17 },
  { categoria: "D", montoMensual: 72414.10, incluyeObraSocial: true, incluyeJubilacion: true, limiteFacturacion: 2806432.76 },
  { categoria: "E", montoMensual: 102537.97, incluyeObraSocial: true, incluyeJubilacion: true, limiteFacturacion: 3741910.34 },
  { categoria: "F", montoMensual: 129045.32, incluyeObraSocial: true, incluyeJubilacion: true, limiteFacturacion: 4677387.93 },
  { categoria: "G", montoMensual: 197108.23, incluyeObraSocial: true, incluyeJubilacion: true, limiteFacturacion: 5612865.51 },
  { categoria: "H", montoMensual: 447346.93, incluyeObraSocial: true, incluyeJubilacion: true, limiteFacturacion: 6548343.10 },
  { categoria: "I", montoMensual: 824802.26, incluyeObraSocial: true, incluyeJubilacion: true, limiteFacturacion: 9354758.68 },
  { categoria: "J", montoMensual: 999007.65, incluyeObraSocial: true, incluyeJubilacion: true, limiteFacturacion: 11241282.00 },
  { categoria: "K", montoMensual: 1381687.90, incluyeObraSocial: true, incluyeJubilacion: true, limiteFacturacion: 15000000.00 },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Conectado a MongoDB");

    for (const categoriaData of categoriasAfip) {
      await ConfiguracionAfip.updateOne(
        { categoria: categoriaData.categoria },
        {
          $set: {
            montoMensual: categoriaData.montoMensual,
            incluyeObraSocial: categoriaData.incluyeObraSocial,
            incluyeJubilacion: categoriaData.incluyeJubilacion,
            limiteFacturacion: categoriaData.limiteFacturacion,
            vigenciaDesde: new Date("2025-01-01"),
            vigenciaHasta: null,
          },
        },
        { upsert: true }
      );
    }
    console.log(`Seed completado: ${categoriasAfip.length} categorías actualizadas/insertadas`);

    await mongoose.disconnect();
    console.log("Desconectado de MongoDB");
  } catch (err) {
    console.error("Error en seed:", err);
    process.exit(1);
  }
}

seed();
