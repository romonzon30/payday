const mongoose = require("mongoose");

const NotificacionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tipo: {
      type: String,
      required: true,
      enum: ["sistema", "recordatorio", "alerta", "promo"],
    },
    titulo: { type: String, required: true },
    cuerpo: { type: String, required: true },
    leida: { type: Boolean, default: false, index: true },
    canal: { type: String, enum: ["inApp", "email", "ambos"], default: "inApp" },
    metadatos: { type: Object, default: {} },
    refId: { type: mongoose.Schema.Types.ObjectId, default: null },
    leidaEn: { type: Date, default: null },
  },
  { timestamps: { createdAt: "creadoEn", updatedAt: false } }
);

module.exports = mongoose.model("Notificacion", NotificacionSchema);
