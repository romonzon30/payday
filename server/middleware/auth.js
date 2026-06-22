const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { env } = require("../config/env");

// Verifies the Bearer JWT and attaches the full user document as req.user.
async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token requerido" });
  }

  try {
    const decoded = jwt.verify(header.split(" ")[1], env.jwtSecret);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: "Usuario no encontrado" });
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: "Token inválido" });
  }
}

module.exports = authMiddleware;
