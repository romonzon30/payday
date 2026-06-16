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

export type EstadoVencimiento = 'al_dia' | 'pendiente' | 'vencido'

export interface Vencimiento {
  _id: string
  tipo: string
  titulo?: string
  descripcion: string
  monto: number
  fechaVencimiento: string
  estado: EstadoVencimiento
  notificarEmail?: boolean
}

export interface ImpuestoPreview {
  id: string
  nombre: string
  descripcion: string
  categoria: string
  cuitGrupo: number[]
  fechaVencimiento: string
  yaAgregado: boolean
  vencimientoId: string | null
}

export type View = 'login' | 'dashboard' | 'profile' | 'profileCompleted' | 'calendar' | 'impuestos'
