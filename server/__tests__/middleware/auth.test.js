const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const jwt = require('jsonwebtoken')
const authMiddleware = require('../../middleware/auth')
const User = require('../../models/User')

let mongod

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
  process.env.JWT_SECRET = 'test-jwt-secret'
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

afterEach(async () => {
  await User.deleteMany({})
})

function createMockReqRes(headers = {}) {
  const req = { headers }
  const res = {
    statusCode: 200,
    jsonData: null,
    status(code) {
      this.statusCode = code
      return this
    },
    json(data) {
      this.jsonData = data
      return this
    },
  }
  const next = jest.fn()
  return { req, res, next }
}

describe('Auth Middleware', () => {
  test('should return 401 when no Authorization header', async () => {
    const { req, res, next } = createMockReqRes({})
    await authMiddleware(req, res, next)

    expect(res.statusCode).toBe(401)
    expect(res.jsonData.message).toBe('Token requerido')
    expect(next).not.toHaveBeenCalled()
  })

  test('should return 401 when Authorization header is not Bearer', async () => {
    const { req, res, next } = createMockReqRes({
      authorization: 'Basic some-token',
    })
    await authMiddleware(req, res, next)

    expect(res.statusCode).toBe(401)
    expect(res.jsonData.message).toBe('Token requerido')
  })

  test('should return 401 for invalid token', async () => {
    const { req, res, next } = createMockReqRes({
      authorization: 'Bearer invalid-token',
    })
    await authMiddleware(req, res, next)

    expect(res.statusCode).toBe(401)
    expect(res.jsonData.message).toBe('Token inválido')
  })

  test('should return 401 when user not found', async () => {
    const fakeId = new mongoose.Types.ObjectId()
    const token = jwt.sign({ id: fakeId }, process.env.JWT_SECRET)
    const { req, res, next } = createMockReqRes({
      authorization: `Bearer ${token}`,
    })
    await authMiddleware(req, res, next)

    expect(res.statusCode).toBe(401)
    expect(res.jsonData.message).toBe('Usuario no encontrado')
  })

  test('should attach user to req and call next for valid token', async () => {
    const user = await new User({
      googleUid: 'auth-test-uid',
      email: 'auth@test.com',
      emailNotificaciones: 'auth@test.com',
      nombreCompleto: 'Auth User',
    }).save()

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)
    const { req, res, next } = createMockReqRes({
      authorization: `Bearer ${token}`,
    })
    await authMiddleware(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(req.user).toBeDefined()
    expect(req.user.email).toBe('auth@test.com')
  })
})
