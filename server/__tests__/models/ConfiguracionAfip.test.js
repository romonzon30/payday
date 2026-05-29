const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const ConfiguracionAfip = require('../../models/ConfiguracionAfip')

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
  await ConfiguracionAfip.deleteMany({})
})

describe('ConfiguracionAfip Model', () => {
  const validConfig = {
    categoria: 'A',
    montoMensual: 1867.5,
    incluyeObraSocial: false,
    incluyeJubilacion: false,
    limiteFacturacion: 748382.07,
    vigenciaDesde: new Date('2025-01-01'),
  }

  test('should create a config with valid data', async () => {
    const config = await new ConfiguracionAfip(validConfig).save()
    expect(config.categoria).toBe('A')
    expect(config.montoMensual).toBe(1867.5)
    expect(config.incluyeObraSocial).toBe(false)
    expect(config.incluyeJubilacion).toBe(false)
    expect(config.moneda).toBe('ARS')
    expect(config.vigenciaHasta).toBeNull()
  })

  test('should require categoria', async () => {
    const config = new ConfiguracionAfip({ ...validConfig, categoria: undefined })
    await expect(config.save()).rejects.toThrow()
  })

  test('should require montoMensual', async () => {
    const config = new ConfiguracionAfip({ ...validConfig, montoMensual: undefined })
    await expect(config.save()).rejects.toThrow()
  })

  test('should require vigenciaDesde', async () => {
    const config = new ConfiguracionAfip({ ...validConfig, vigenciaDesde: undefined })
    await expect(config.save()).rejects.toThrow()
  })

  test('should enforce unique categoria', async () => {
    await new ConfiguracionAfip(validConfig).save()
    const duplicate = new ConfiguracionAfip(validConfig)
    await expect(duplicate.save()).rejects.toThrow()
  })

  test('should default moneda to ARS', async () => {
    const config = await new ConfiguracionAfip(validConfig).save()
    expect(config.moneda).toBe('ARS')
  })

  test('should default vigenciaHasta to null', async () => {
    const config = await new ConfiguracionAfip(validConfig).save()
    expect(config.vigenciaHasta).toBeNull()
  })
})
