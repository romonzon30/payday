const router = require("express").Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const createMonotributoDueDates = require("../utils/createMonotributoDueDates");

// POST /api/auth/google — login o auto-registro con Google
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    let user = await User.findOne({ googleUid: payload.sub });

    if (!user) {
  user = new User({
    googleUid: payload.sub,
    email: payload.email,
    emailNotificaciones: payload.email,
    nombreCompleto: payload.name,
    avatarUrl: payload.picture,
    activo: true,
  });

  await user.save();

  await createMonotributoDueDates(user._id);
}

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.json({ token, user });
  } catch (err) {
    console.error("Error en /auth/google:", err.message);
    res.status(500).json({ message: "Error al iniciar sesión con Google" });
  }
});

router.post("/register", async (req, res) => {
  try {
    const { token: authToken, nombreCompleto, dni, emailNotificaciones } = req.body;

    const decoded = jwt.verify(authToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    if (nombreCompleto) user.nombreCompleto = nombreCompleto;
    if (dni) user.dni = dni;
    if (emailNotificaciones) user.emailNotificaciones = emailNotificaciones;

    await user.save();

    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Error al completar registro" });
  }
});

router.post("/google-access", async (req, res) => {
  try {
    const { accessToken, nombreCompleto, dni } = req.body;

    const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      return res.status(401).json({ message: "Token de Google inválido" });
    }

    const userInfo = await response.json();

    let user = await User.findOne({ googleUid: userInfo.sub });

    if (!user) {
      user = new User({
        googleUid: userInfo.sub,
        email: userInfo.email,
        emailNotificaciones: userInfo.email,
        nombreCompleto: nombreCompleto || userInfo.name,
        avatarUrl: userInfo.picture,
        dni,
        activo: true,
      });
      await user.save();
    } else {
      if (nombreCompleto) user.nombreCompleto = nombreCompleto;
      if (dni) user.dni = dni;
      await user.save();
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ message: "Error al procesar registro con Google" });
  }
});

module.exports = router;
