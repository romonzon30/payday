const router = require("express").Router();
const authMiddleware = require("../middleware/auth");
const asyncHandler = require("../middleware/asyncHandler");
const userController = require("../controllers/userController");

router.get("/me", authMiddleware, asyncHandler(userController.me));
router.put("/profile", authMiddleware, asyncHandler(userController.updateProfile));
router.get("/vencimientos", authMiddleware, asyncHandler(userController.listVencimientos));
router.post("/vencimientos", authMiddleware, asyncHandler(userController.createVencimiento));
router.delete("/vencimientos/:id", authMiddleware, asyncHandler(userController.deleteVencimiento));
router.patch("/vencimientos/:id", authMiddleware, asyncHandler(userController.patchVencimiento));

module.exports = router;
