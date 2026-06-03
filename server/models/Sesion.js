const mongoose = require("mongoose");

const SesionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    refreshToken: { type: String, unique: true, required: true },
    dispositivo: { type: String },
    ip: { type: String },
    expiraEn: { type: Date, index: { expireAfterSeconds: 0 } },
  },
  { timestamps: { createdAt: "creadoEn", updatedAt: false } }
);

module.exports = mongoose.model("Sesion", SesionSchema);
