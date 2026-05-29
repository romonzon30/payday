const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const Impuesto = require('../../models/Impuesto')
const Notificacion = require('../../models/Notificacion')
const Sesion = require('../../models/Sesion')
const DueDate = require('../../models/DueDate')
const User = require('../../models/User')

let mongod

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

afterEach(async () => {
  await Impuesto.deleteMany({})
  await Notificacion.deleteMany({})
  await Sesion.deleteMany({})
  await DueDate.deleteMany({})
  await User.deleteMany({})
})

describe('Impuesto Model', () => {
  let userId

  beforeEach(async () => {
    const user = await new User({
      googleUid: 'test-uid-imp',
      email: 'imp@test.com',
      emailNotificaciones: 'imp@test.com',
      nombreCompleto: 'Test',
    }).save()
    userId = user._id
  })

  test('should create impuesto with valid data', async () => {
    const imp = await new Impuesto({
      userId,
      tipo: 'monotributo',
      monto: 1867.5,
      periodo: '2026-06',
    }).save()

    expect(imp.tipo).toBe('monotributo')
    expect(imp.monto).toBe(1867.5)
    expect(imp.moneda).toBe('ARS')
    expect(imp.estado).toBe('vigente')
  })

  test('should require tipo', async () => {
    const imp = new Impuesto({ userId, monto: 100, periodo: '2026-06' })
    await expect(imp.save()).rejects.toThrow()
  })

  test('should validate tipo enum', async () => {
    const imp = new Impuesto({ userId, tipo: 'invalido', monto: 100, periodo: '2026-06' })
    await expect(imp.save()).rejects.toThrow()
  })

  test('should accept valid tipo values', async () => {
    const validTypes = ['monotributo', 'obra_social', 'jubilacion', 'ingresos_brutos', 'otro']
    for (const tipo of validTypes) {
      const imp = await new Impuesto({ userId, tipo, monto: 100, periodo: '2026-06' }).save()
      expect(imp.tipo).toBe(tipo)
    }
  })
})

describe('Notificacion Model', () => {
  let userId

  beforeEach(async () => {
    const user = await new User({
      googleUid: 'test-uid-notif',
      email: 'notif@test.com',
      emailNotificaciones: 'notif@test.com',
      nombreCompleto: 'Test',
    }).save()
    userId = user._id
  })

  test('should create notificacion with valid data', async () => {
    const notif = await new Notificacion({
      userId,
      tipo: 'recordatorio',
      titulo: 'Vencimiento próximo',
      cuerpo: 'Tu monotributo vence en 3 días',
    }).save()

    expect(notif.tipo).toBe('recordatorio')
    expect(notif.leida).toBe(false)
    expect(notif.canal).toBe('inApp')
  })

  test('should require titulo and cuerpo', async () => {
    const notif = new Notificacion({ userId, tipo: 'sistema' })
    await expect(notif.save()).rejects.toThrow()
  })

  test('should validate tipo enum', async () => {
    const notif = new Notificacion({
      userId,
      tipo: 'invalido',
      titulo: 'Test',
      cuerpo: 'Test',
    })
    await expect(notif.save()).rejects.toThrow()
  })
})

describe('Sesion Model', () => {
  let userId

  beforeEach(async () => {
    const user = await new User({
      googleUid: 'test-uid-sesion',
      email: 'sesion@test.com',
      emailNotificaciones: 'sesion@test.com',
      nombreCompleto: 'Test',
    }).save()
    userId = user._id
  })

  test('should create sesion with valid data', async () => {
    const sesion = await new Sesion({
      userId,
      refreshToken: 'unique-refresh-token-123',
      dispositivo: 'Chrome/Windows',
      ip: '192.168.1.1',
      expiraEn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    }).save()

    expect(sesion.refreshToken).toBe('unique-refresh-token-123')
    expect(sesion.dispositivo).toBe('Chrome/Windows')
  })

  test('should require refreshToken', async () => {
    const sesion = new Sesion({ userId })
    await expect(sesion.save()).rejects.toThrow()
  })
})

describe('DueDate Model', () => {
  let userId

  beforeEach(async () => {
    const user = await new User({
      googleUid: 'test-uid-due',
      email: 'due@test.com',
      emailNotificaciones: 'due@test.com',
      nombreCompleto: 'Test',
    }).save()
    userId = user._id
  })

  test('should create due date with valid data', async () => {
    const dd = await new DueDate({
      userId,
      title: 'Monotributo',
      date: '2026-06-19',
      type: 'tax',
    }).save()

    expect(dd.title).toBe('Monotributo')
    expect(dd.date).toBe('2026-06-19')
    expect(dd.type).toBe('tax')
  })

  test('should require userId', async () => {
    const dd = new DueDate({ title: 'Test' })
    await expect(dd.save()).rejects.toThrow()
  })
})
