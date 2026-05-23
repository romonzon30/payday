const mongoose = require("mongoose");
require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const ConfiguracionAfip = require("./models/ConfiguracionAfip");

const categoriasAfip = [
  { categoria: "A", montoMensual: 1867.50, incluyeObraSocial: false, incluyeJubilacion: false, limiteFacturacion: 748382.07 },
  { categoria: "B", montoMensual: 2215.30, incluyeObraSocial: false, incluyeJubilacion: false, limiteFacturacion: 1122573.10 },
  { categoria: "C", montoMensual: 3659.07, incluyeObraSocial: true,  incluyeJubilacion: true,  limiteFacturacion: 1870955.17 },
  { categoria: "D", montoMensual: 7947.20, incluyeObraSocial: true,  incluyeJubilacion: true,  limiteFacturacion: 2806432.76 },
  { categoria: "E", montoMensual: 10158.75, incluyeObraSocial: true,  incluyeJubilacion: true,  limiteFacturacion: 3741910.34 },
  { categoria: "F", montoMensual: 12567.43, incluyeObraSocial: true,  incluyeJubilacion: true,  limiteFacturacion: 4677387.93 },
  { categoria: "G", montoMensual: 15271.80, incluyeObraSocial: true,  incluyeJubilacion: true,  limiteFacturacion: 5612865.51 },
  { categoria: "H", montoMensual: 19780.25, incluyeObraSocial: true,  incluyeJubilacion: true,  limiteFacturacion: 6548343.10 },
  { categoria: "I", montoMensual: 30986.50, incluyeObraSocial: true,  incluyeJubilacion: true,  limiteFacturacion: 9354758.68 },
  { categoria: "J", montoMensual: 45000.00, incluyeObraSocial: true,  incluyeJubilacion: true,  limiteFacturacion: 11241282.00 },
  { categoria: "K", montoMensual: 65000.00, incluyeObraSocial: true,  incluyeJubilacion: true,  limiteFacturacion: 15000000.00 },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Conectado a MongoDB");

    await ConfiguracionAfip.deleteMany({});
    console.log("Datos existentes de configuracion_afip eliminados");

    const docs = categoriasAfip.map((cat) => ({
      ...cat,
      vigenciaDesde: new Date("2025-01-01"),
      vigenciaHasta: null,
    }));

    await ConfiguracionAfip.insertMany(docs);
    console.log(`Seed completado: ${docs.length} categorías insertadas`);

    await mongoose.disconnect();
    console.log("Desconectado de MongoDB");
  } catch (err) {
    console.error("Error en seed:", err);
    process.exit(1);
  }
}

seed();
