const mongoose = require("mongoose");

const ImpuestoSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tipo: {
      type: String,
      required: true,
      enum: ["monotributo", "obra_social", "jubilacion", "ingresos_brutos", "otro"],
    },
    descripcion: { type: String },
    monto: { type: Number, required: true },
    moneda: { type: String, enum: ["ARS", "USD"], default: "ARS" },
    estado: { type: String, enum: ["vigente", "anulado"], default: "vigente" },
    periodo: { type: String, required: true },
  },
  { timestamps: { createdAt: "creadoEn", updatedAt: false } }
);

module.exports = mongoose.model("Impuesto", ImpuestoSchema);
