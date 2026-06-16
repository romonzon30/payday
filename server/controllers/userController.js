const userService = require("../services/userService");
const vencimientoService = require("../services/vencimientoService");

async function me(req, res) {
  await userService.ensureCurrentYearVencimientos(req.user);
  res.json({ user: req.user });
}

async function updateProfile(req, res) {
  const user = await userService.updateProfile(req.user, req.body);
  res.json({ user });
}

async function listVencimientos(req, res) {
  const year = parseInt(req.query.year) || new Date().getUTCFullYear();
  const month = parseInt(req.query.month) || new Date().getUTCMonth() + 1;
  const vencimientos = await vencimientoService.listForMonth(req.user, year, month);
  res.json({ vencimientos });
}

async function createVencimiento(req, res) {
  const body = await vencimientoService.createCustom(req.user, req.body);
  res.status(201).json(body);
}

async function deleteVencimiento(req, res) {
  await vencimientoService.removeCustom(req.user, req.params.id);
  res.json({ ok: true });
}

async function patchVencimiento(req, res) {
  const vencimiento = await vencimientoService.updateEstado(req.user, req.params.id, req.body.estado);
  res.json({ vencimiento });
}

module.exports = { me, updateProfile, listVencimientos, createVencimiento, deleteVencimiento, patchVencimiento };
