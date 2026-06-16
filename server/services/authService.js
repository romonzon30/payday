// Authentication: Google sign-in / auto-registration and JWT issuance.

const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const { env } = require("../config/env");
const { HttpError } = require("../middleware/errorHandler");

const client = new OAuth2Client(env.googleClientId);

function signToken(user) {
  return jwt.sign({ id: user._id }, env.jwtSecret);
}

// Verifies a Google ID token, finds or creates the user, returns {token, user}.
async function loginWithGoogleCredential(credential) {
  const ticket = await client.verifyIdToken({ idToken: credential, audience: env.googleClientId });
  const payload = ticket.getPayload();

  let user = await User.findOne({ googleUid: payload.sub });
  if (!user) {
    user = await User.create({
      googleUid: payload.sub,
      email: payload.email,
      emailNotificaciones: payload.email,
      nombreCompleto: payload.name,
      avatarUrl: payload.picture,
      activo: true,
    });
  }

  return { token: signToken(user), user };
}

// Completes registration for an already-authenticated user (JWT in body).
async function register({ token: authToken, nombreCompleto, dni, emailNotificaciones }) {
  const decoded = jwt.verify(authToken, env.jwtSecret);
  const user = await User.findById(decoded.id);
  if (!user) throw new HttpError(404, "Usuario no encontrado");

  if (nombreCompleto) user.nombreCompleto = nombreCompleto;
  if (dni) user.dni = dni;
  if (emailNotificaciones) user.emailNotificaciones = emailNotificaciones;
  await user.save();

  return { user };
}

// Google implicit-flow sign-in using an access token (userinfo lookup).
async function loginWithGoogleAccess({ accessToken, nombreCompleto, dni }) {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new HttpError(401, "Token de Google inválido");

  const userInfo = await response.json();
  let user = await User.findOne({ googleUid: userInfo.sub });
  if (!user) {
    user = await User.create({
      googleUid: userInfo.sub,
      email: userInfo.email,
      emailNotificaciones: userInfo.email,
      nombreCompleto: nombreCompleto || userInfo.name,
      avatarUrl: userInfo.picture,
      dni,
      activo: true,
    });
  } else {
    if (nombreCompleto) user.nombreCompleto = nombreCompleto;
    if (dni) user.dni = dni;
    await user.save();
  }

  return { token: signToken(user), user };
}

module.exports = { loginWithGoogleCredential, register, loginWithGoogleAccess };
