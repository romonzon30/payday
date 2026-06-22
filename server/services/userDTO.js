// Serializes a User document to the shape the client needs, dropping internal
// fields (googleUid, __v, timestamps) so handlers never ship the raw Mongoose doc.
function toUserDTO(user) {
  return {
    _id: user._id,
    email: user.email,
    emailNotificaciones: user.emailNotificaciones,
    nombreCompleto: user.nombreCompleto,
    dni: user.dni,
    cuit: user.cuit,
    avatarUrl: user.avatarUrl,
    categoriaMonotributo: user.categoriaMonotributo,
    fechaInscripcion: user.fechaInscripcion,
    perfilCompleto: user.perfilCompleto,
    activo: user.activo,
    inicioActividad: user.inicioActividad,
    personasACargo: user.personasACargo,
  };
}

module.exports = { toUserDTO };
