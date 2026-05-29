const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const Vencimiento = require('../../models/Vencimiento')
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
  await Vencimiento.deleteMany({})
  await User.deleteMany({})
})

describe('Vencimiento Model', () => {
  let userId

  beforeEach(async () => {
    const user = await new User({
      googleUid: 'test-uid',
      email: 'test@test.com',
      emailNotificaciones: 'test@test.com',
      nombreCompleto: 'Test User',
    }).save()
    userId = user._id
  })

  test('should create a vencimiento with valid data', async () => {
    const venc = await new Vencimiento({
      userId,
      tipo: 'monotributo',
      descripcion: 'AFIP - Monotributo',
      monto: 1867.5,
      fechaVencimiento: new Date('2026-06-19'),
      estado: 'pendiente',
    }).save()

    expect(venc.tipo).toBe('monotributo')
    expect(venc.descripcion).toBe('AFIP - Monotributo')
    expect(venc.monto).toBe(1867.5)
    expect(venc.estado).toBe('pendiente')
    expect(venc.recordatorioEnviado).toBe(false)
  })

  test('should require userId', async () => {
    const venc = new Vencimiento({
      fechaVencimiento: new Date(),
    })
    await expect(venc.save()).rejects.toThrow()
  })

  test('should require fechaVencimiento', async () => {
    const venc = new Vencimiento({ userId })
    await expect(venc.save()).rejects.toThrow()
  })

  test('should default estado to pendiente', async () => {
    const venc = await new Vencimiento({
      userId,
      fechaVencimiento: new Date(),
    }).save()
    expect(venc.estado).toBe('pendiente')
  })

  test('should accept valid estado values', async () => {
    const validStates = ['pendiente', 'pagado', 'vencido', 'al_dia']
    for (const estado of validStates) {
      const venc = await new Vencimiento({
        userId,
        fechaVencimiento: new Date(),
        estado,
      }).save()
      expect(venc.estado).toBe(estado)
    }
  })

  test('should reject invalid estado', async () => {
    const venc = new Vencimiento({
      userId,
      fechaVencimiento: new Date(),
      estado: 'invalido',
    })
    await expect(venc.save()).rejects.toThrow()
  })

  test('should default monto to 0', async () => {
    const venc = await new Vencimiento({
      userId,
      fechaVencimiento: new Date(),
    }).save()
    expect(venc.monto).toBe(0)
  })

  test('should default recordatorioEnviado to false', async () => {
    const venc = await new Vencimiento({
      userId,
      fechaVencimiento: new Date(),
    }).save()
    expect(venc.recordatorioEnviado).toBe(false)
  })
})
