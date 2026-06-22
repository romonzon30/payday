const router = require("express").Router();
const authMiddleware = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const impuestoController = require("../controllers/impuestoController");

// GET /api/impuestos/preview?year=2026&month=5  (month is 0-indexed)
router.get("/preview", authMiddleware, asyncHandler(impuestoController.preview));
router.post("/agregar", authMiddleware, asyncHandler(impuestoController.agregar));
router.delete("/:vencimientoId", authMiddleware, asyncHandler(impuestoController.remove));

module.exports = router;
