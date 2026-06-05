export interface User {
  _id: string
  googleUid: string
  email: string
  emailNotificaciones: string
  nombreCompleto: string
  dni?: string
  cuit?: string
  avatarUrl?: string
  categoriaMonotributo?: string
  fechaInscripcion?: string
  perfilCompleto: boolean
  activo: boolean
  inicioActividad?: 'normal' | 'primer_anio' | 'segundo_anio'
  personasACargo?: number
}