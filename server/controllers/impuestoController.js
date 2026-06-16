const impuestoService = require("../services/impuestoService");

async function preview(req, res) {
  const now = new Date();
  const year = parseInt(req.query.year) || now.getUTCFullYear();
  const month = req.query.month !== undefined ? parseInt(req.query.month) : now.getUTCMonth();
  res.json(await impuestoService.preview(req.user, year, month));
}

async function agregar(req, res) {
  const body = await impuestoService.agregar(req.user, req.body);
  res.status(201).json(body);
}

async function remove(req, res) {
  await impuestoService.remove(req.user, req.params.vencimientoId);
  res.json({ ok: true });
}

module.exports = { preview, agregar, remove };
