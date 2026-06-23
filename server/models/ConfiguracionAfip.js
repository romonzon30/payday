const mongoose = require("mongoose");

const ConfiguracionAfipSchema = new mongoose.Schema(
  {
    categoria: { type: String, unique: true, required: true },
    montoMensual: { type: Number, required: true },
    incluyeObraSocial: { type: Boolean },
    incluyeJubilacion: { type: Boolean },
    limiteFacturacion: { type: Number },
    moneda: { type: String, default: "ARS" },
    costoPorCarga: { type: Number, default: 0 },
    vigenciaDesde: { type: Date, required: true },
    vigenciaHasta: { type: Date, default: null },
  },
  { timestamps: { createdAt: false, updatedAt: "actualizadoEn" } }
);

module.exports = mongoose.model("ConfiguracionAfip", ConfiguracionAfipSchema);