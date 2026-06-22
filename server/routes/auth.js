const router = require("express").Router();
const asyncHandler = require("../middleware/asyncHandler");
const authController = require("../controllers/authController");

router.post("/google", asyncHandler(authController.google));
router.post("/register", asyncHandler(authController.register));
router.post("/google-access", asyncHandler(authController.googleAccess));

module.exports = router;
