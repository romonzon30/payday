import type { User } from '../types'

export const mockUser: User = {
  _id: '507f1f77bcf86cd799439011',
  googleUid: 'google-uid-123',
  email: 'test@example.com',
  emailNotificaciones: 'test@example.com',
  nombreCompleto: 'Juan Pérez',
  dni: '12345678',
  cuit: '20-12345678-9',
  avatarUrl: 'https://example.com/avatar.jpg',
  categoriaMonotributo: 'A',
  fechaInscripcion: '2024-01-01',
  perfilCompleto: true,
  activo: true,
}

export const mockUserIncomplete: User = {
  _id: '507f1f77bcf86cd799439012',
  googleUid: 'google-uid-456',
  email: 'incomplete@example.com',
  emailNotificaciones: 'incomplete@example.com',
  nombreCompleto: 'María López',
  perfilCompleto: false,
  activo: true,
}
