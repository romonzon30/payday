const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    googleUid: { type: String, unique: true, required: true, desc: "UID de Google OAuth" },
    email: { type: String, unique: true, required: true },
    emailNotificaciones: { type: String, required: true },
    nombreCompleto: { type: String, required: true },
    dni: { type: String, unique: true, sparse: true },
    cuit: { type: String },
    avatarUrl: { type: String },
    categoriaMonotributo: {
      type: String,
      enum: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K"],
    },
    fechaInscripcion: { type: Date },
    perfilCompleto: { type: Boolean, default: false },
    activo: { type: Boolean, default: true },
    inicioActividad: {
      type: String,
      enum: ["normal", "primer_anio", "segundo_anio"],
      default: "normal",
    },
    personasACargo: { type: Number, default: 0, min: 0, max: 5 },
  },
  {
    timestamps: { createdAt: "creadoEn", updatedAt: "actualizadoEn" },
  }
);

module.exports = mongoose.model("User", UserSchema);
