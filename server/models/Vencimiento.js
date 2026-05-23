const mongoose = require("mongoose");

const VencimientoSchema = new mongoose.Schema(
  {
    impuestoId: { type: mongoose.Schema.Types.ObjectId, ref: "Impuesto", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    fechaVencimiento: { type: Date, required: true, index: true },
    fechaPago: { type: Date, default: null },
    estado: {
      type: String,
      enum: ["pendiente", "pagado", "vencido"],
      default: "pendiente",
    },
    recordatorioEnviado: { type: Boolean, default: false },
    notaUsuario: { type: String, default: "" },
  },
  { timestamps: { createdAt: "creadoEn", updatedAt: false } }
);

module.exports = mongoose.model("Vencimiento", VencimientoSchema);
