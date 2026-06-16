// User profile operations.

const ConfiguracionAfip = require("../models/ConfiguracionAfip");
const { upsertMonotributoVencimientos } = require("./monotributoService");
const { HttpError } = require("../middleware/errorHandler");

// Ensures the current year's vencimientos exist; failures are non-fatal.
async function ensureCurrentYearVencimientos(user) {
  try {
    await upsertMonotributoVencimientos(user, new Date().getUTCFullYear());
  } catch (err) {
    console.error("Error asegurando vencimientos:", err.message);
  }
}

// Validates and applies a profile update, re-syncing vencimientos if complete.
async function updateProfile(user, body) {
  const { nombreCompleto, cuit, emailNotificaciones, categoriaMonotributo, inicioActividad, personasACargo } = body;

  if (nombreCompleto) user.nombreCompleto = nombreCompleto.trim();
  if (emailNotificaciones) user.emailNotificaciones = emailNotificaciones.trim();
  if (cuit && cuit.trim()) user.cuit = cuit.trim();

  if (categoriaMonotributo) {
    const categoria = String(categoriaMonotributo).trim().toUpperCase();
    const config = await ConfiguracionAfip.findOne({ categoria });
    if (!config) throw new HttpError(400, "Categoría de monotributo inválida");
    user.categoriaMonotributo = config.categoria;
    user.fechaInscripcion = user.fechaInscripcion || new Date();
  }

  if (inicioActividad !== undefined) {
    if (!["normal", "primer_anio", "segundo_anio"].includes(inicioActividad)) {
      throw new HttpError(400, "Valor de inicio de actividad inválido");
    }
    user.inicioActividad = inicioActividad;
  }

  if (personasACargo !== undefined) {
    const n = parseInt(personasACargo, 10);
    if (isNaN(n) || n < 0 || n > 5) throw new HttpError(400, "Personas a cargo debe ser entre 0 y 5");
    user.personasACargo = n;
  }

  user.perfilCompleto = !!user.cuit && !!user.categoriaMonotributo;

  try {
    await user.save();
  } catch (err) {
    if (err.code === 11000) throw new HttpError(409, "El CUIL ya está registrado por otro usuario");
    throw err;
  }

  if (user.perfilCompleto) {
    await upsertMonotributoVencimientos(user, new Date().getUTCFullYear());
  }

  return user;
}

module.exports = { ensureCurrentYearVencimientos, updateProfile };
