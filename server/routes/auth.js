const router = require("express").Router();
const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    res.json({ token, user });
  } catch (err) {
    console.error("Error en /auth/google:", err.message);
    res.status(500).json({ message: "Error al iniciar sesión con Google" });
  }
});

module.exports = router;
