// Shared test harness: in-memory Mongo + a minimal Express app that mounts the
// real routers, so integration tests exercise production handlers without
// index.js's app.listen()/cron side effects.
//
// jest is configured to ignore this file as a test (testPathIgnorePatterns).

const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const { MongoMemoryServer } = require("mongodb-memory-server");

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const ConfiguracionAfip = require("../models/ConfiguracionAfip");
const User = require("../models/User");

let mongod;

async function connect() {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
}

async function disconnect() {
  await mongoose.disconnect();
  if (mongod) await mongod.stop();
}

async function clearDb() {
  const { collections } = mongoose.connection;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}

// Builds an Express app mounting the real routers (no listen, no scheduler).
function buildApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/auth", require("../routes/auth"));
  app.use("/api/user", require("../routes/user"));
  app.use("/api/impuestos", require("../routes/impuestos"));
  return app;
}

// Inserts one AFIP category config (defaults to a real category-C-like shape).
async function seedCategoria(overrides = {}) {
  return ConfiguracionAfip.create({
    categoria: "C",
    montoMensual: 56501.85,
    incluyeObraSocial: true,
    incluyeJubilacion: true,
    limiteFacturacion: 1870955.17,
    costoPorCarga: 12500,
    vigenciaDesde: new Date("2025-01-01"),
    ...overrides,
  });
}

// Creates a user and returns { user, token } with a valid Bearer JWT.
async function makeUserWithToken(overrides = {}) {
  const user = await User.create({
    googleUid: overrides.googleUid || `uid-${new mongoose.Types.ObjectId()}`,
    email: overrides.email || `user-${new mongoose.Types.ObjectId()}@test.com`,
    emailNotificaciones: overrides.emailNotificaciones || "notify@test.com",
    nombreCompleto: overrides.nombreCompleto || "Test User",
    cuit: overrides.cuit,
    categoriaMonotributo: overrides.categoriaMonotributo,
    perfilCompleto: overrides.perfilCompleto || false,
    inicioActividad: overrides.inicioActividad || "normal",
    personasACargo: overrides.personasACargo || 0,
  });
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  return { user, token };
}

module.exports = { connect, disconnect, clearDb, buildApp, seedCategoria, makeUserWithToken };
