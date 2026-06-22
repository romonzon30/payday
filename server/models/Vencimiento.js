const mongoose = require("mongoose");

const VencimientoSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    tipo: { type: String, default: "monotributo" }, // "monotributo" | "custom"
    titulo: { type: String, default: "" },
    descripcion: { type: String, default: "AFIP - Monotributo" },
    monto: { type: Number, default: 0 },
    fechaVencimiento: { type: Date, required: true, index: true },
    fechaPago: { type: Date, default: null },
    estado: {
      type: String,
      enum: ["pendiente", "pagado", "vencido", "al_dia"],
      default: "pendiente",
    },
    notif7dEnviada: { type: Boolean, default: false },
    notif48hEnviada: { type: Boolean, default: false },
    notif24hEnviada: { type: Boolean, default: false },
    notifVencidoEnviada: { type: Boolean, default: false },
    notificarEmail: { type: Boolean, default: false },
    recurrente: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: "creadoEn", updatedAt: false } }
);

// Listados del calendario / impuestos: { userId, tipo, fechaVencimiento }.
VencimientoSchema.index({ userId: 1, tipo: 1, fechaVencimiento: 1 });
// Barrido horario del scheduler de notificaciones.
VencimientoSchema.index({ estado: 1, notificarEmail: 1, fechaVencimiento: 1 });

module.exports = mongoose.model("Vencimiento", VencimientoSchema);
