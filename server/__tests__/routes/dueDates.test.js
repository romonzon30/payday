const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const express = require('express')
const request = require('supertest')
const jwt = require('jsonwebtoken')
const DueDate = require('../../models/DueDate')
const User = require('../../models/User')
const dueDateRoutes = require('../../routes/dueDates')

let mongod
let app

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
  process.env.JWT_SECRET = 'test-jwt-secret'

  app = express()
  app.use(express.json())
  app.use('/api/duedates', dueDateRoutes)
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

afterEach(async () => {
  await DueDate.deleteMany({})
  await User.deleteMany({})
})

function createToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET)
}

describe('DueDate Routes', () => {
  let user, token

  beforeEach(async () => {
    user = await new User({
      googleUid: 'duedate-uid',
      email: 'duedate@test.com',
      emailNotificaciones: 'duedate@test.com',
      nombreCompleto: 'DueDate User',
    }).save()
    token = createToken(user._id)
  })

  describe('GET /api/duedates', () => {
    test('should return 401 without token', async () => {
      const res = await request(app).get('/api/duedates')
      expect(res.status).toBe(401)
    })

    test('should return empty array when no due dates', async () => {
      const res = await request(app)
        .get('/api/duedates')
        .set('Authorization', `Bearer ${token}`)
      expect(res.status).toBe(200)
      expect(res.body).toEqual([])
    })

    test('should return user due dates', async () => {
      await new DueDate({
        userId: user._id,
        title: 'Monotributo',
        date: '2026-06-19',
        type: 'tax',
      }).save()

      const res = await request(app)
        .get('/api/duedates')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(1)
      expect(res.body[0].title).toBe('Monotributo')
    })

    test('should not return other users due dates', async () => {
      const otherUser = await new User({
        googleUid: 'other-uid',
        email: 'other@test.com',
        emailNotificaciones: 'other@test.com',
        nombreCompleto: 'Other User',
      }).save()

      await new DueDate({
        userId: otherUser._id,
        title: 'Other Due Date',
        date: '2026-06-19',
        type: 'tax',
      }).save()

      const res = await request(app)
        .get('/api/duedates')
        .set('Authorization', `Bearer ${token}`)

      expect(res.status).toBe(200)
      expect(res.body).toHaveLength(0)
    })
  })

  describe('POST /api/duedates', () => {
    test('should return 401 without token', async () => {
      const res = await request(app)
        .post('/api/duedates')
        .send({ title: 'Test', date: '2026-06-19', type: 'tax' })
      expect(res.status).toBe(401)
    })

    test('should create a new due date', async () => {
      const res = await request(app)
        .post('/api/duedates')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Monotributo', date: '2026-06-19', type: 'tax' })

      expect(res.status).toBe(200)
      expect(res.body.title).toBe('Monotributo')
      expect(res.body.date).toBe('2026-06-19')
      expect(res.body.type).toBe('tax')
      expect(res.body.userId).toBe(user._id.toString())
    })

    test('should persist the created due date', async () => {
      await request(app)
        .post('/api/duedates')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Persist Test', date: '2026-07-01', type: 'other' })

      const dueDates = await DueDate.find({ userId: user._id })
      expect(dueDates).toHaveLength(1)
      expect(dueDates[0].title).toBe('Persist Test')
    })
  })
})
