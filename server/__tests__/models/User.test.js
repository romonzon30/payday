const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
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
  await User.deleteMany({})
})

describe('User Model', () => {
  const validUserData = {
    googleUid: 'google-uid-123',
    email: 'test@example.com',
    emailNotificaciones: 'test@example.com',
    nombreCompleto: 'Juan Pérez',
    activo: true,
  }

  test('should create a user with valid data', async () => {
    const user = new User(validUserData)
    const savedUser = await user.save()

    expect(savedUser._id).toBeDefined()
    expect(savedUser.googleUid).toBe('google-uid-123')
    expect(savedUser.email).toBe('test@example.com')
    expect(savedUser.nombreCompleto).toBe('Juan Pérez')
    expect(savedUser.perfilCompleto).toBe(false)
    expect(savedUser.activo).toBe(true)
  })

  test('should require googleUid', async () => {
    const user = new User({ ...validUserData, googleUid: undefined })
    await expect(user.save()).rejects.toThrow()
  })

  test('should require email', async () => {
    const user = new User({ ...validUserData, email: undefined })
    await expect(user.save()).rejects.toThrow()
  })

  test('should require emailNotificaciones', async () => {
    const user = new User({ ...validUserData, emailNotificaciones: undefined })
    await expect(user.save()).rejects.toThrow()
  })

  test('should require nombreCompleto', async () => {
    const user = new User({ ...validUserData, nombreCompleto: undefined })
    await expect(user.save()).rejects.toThrow()
  })

  test('should enforce unique googleUid', async () => {
    await new User(validUserData).save()
    const duplicateUser = new User({ ...validUserData, email: 'other@test.com' })
    await expect(duplicateUser.save()).rejects.toThrow()
  })

  test('should enforce unique email', async () => {
    await new User(validUserData).save()
    const duplicateUser = new User({ ...validUserData, googleUid: 'different-uid' })
    await expect(duplicateUser.save()).rejects.toThrow()
  })

  test('should default perfilCompleto to false', async () => {
    const user = await new User(validUserData).save()
    expect(user.perfilCompleto).toBe(false)
  })

  test('should accept valid categoriaMonotributo values', async () => {
    const validCategories = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']
    for (const cat of validCategories) {
      await User.deleteMany({})
      const user = await new User({
        ...validUserData,
        categoriaMonotributo: cat,
      }).save()
      expect(user.categoriaMonotributo).toBe(cat)
    }
  })

  test('should reject invalid categoriaMonotributo', async () => {
    const user = new User({
      ...validUserData,
      categoriaMonotributo: 'Z',
    })
    await expect(user.save()).rejects.toThrow()
  })

  test('should save optional fields correctly', async () => {
    const fullUser = await new User({
      ...validUserData,
      dni: '12345678',
      cuit: '20-12345678-9',
      avatarUrl: 'https://example.com/avatar.jpg',
      categoriaMonotributo: 'A',
      perfilCompleto: true,
    }).save()

    expect(fullUser.dni).toBe('12345678')
    expect(fullUser.cuit).toBe('20-12345678-9')
    expect(fullUser.avatarUrl).toBe('https://example.com/avatar.jpg')
    expect(fullUser.categoriaMonotributo).toBe('A')
    expect(fullUser.perfilCompleto).toBe(true)
  })

  test('should have timestamps', async () => {
    const user = await new User(validUserData).save()
    expect(user.creadoEn).toBeDefined()
    expect(user.actualizadoEn).toBeDefined()
  })
})
