const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  console.log("[AUTH] Header:", header ? header.substring(0, 30) + "..." : "MISSING");
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token requerido" });
  }

  try {
    const decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
    console.log("[AUTH] Decoded id:", decoded.id);
    const user = await User.findById(decoded.id);
    if (!user) {
      console.log("[AUTH] User NOT found in DB");
      return res.status(401).json({ message: "Usuario no encontrado" });
    }
    console.log("[AUTH] User found:", user.email);
    req.user = user;
    next();
  } catch (err) {
    console.log("[AUTH] Token error:", err.message);
    res.status(401).json({ message: "Token inválido" });
  }
}

module.exports = authMiddleware;
