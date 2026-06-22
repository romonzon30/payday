// Authentication: Google sign-in / auto-registration and JWT issuance.

const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const { env } = require("../config/env");
const { toUserDTO } = require("./userDTO");
const { HttpError } = require("../middleware/errorHandler");

const client = new OAuth2Client(env.googleClientId);

function signToken(user) {
  return jwt.sign({ id: user._id }, env.jwtSecret, { expiresIn: "7d" });
}

// fetch with a hard timeout so a hung Google response can't hang the request.
async function fetchWithTimeout(url, options = {}, ms = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
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

  return { token: signToken(user), user: toUserDTO(user) };
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

  return { user: toUserDTO(user) };
}

// Google implicit-flow sign-in using an access token. Verifies the token's
// audience via tokeninfo (userinfo alone can't prove the token was issued for
// this app), then looks up the profile.
async function loginWithGoogleAccess({ accessToken, nombreCompleto, dni }) {
  const tokenInfoRes = await fetchWithTimeout(
    `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`
  );
  if (!tokenInfoRes.ok) throw new HttpError(401, "Token de Google inválido");
  const tokenInfo = await tokenInfoRes.json();
  if (tokenInfo.aud !== env.googleClientId) throw new HttpError(401, "Token de Google inválido");

  const response = await fetchWithTimeout("https://www.googleapis.com/oauth2/v3/userinfo", {
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

  return { token: signToken(user), user: toUserDTO(user) };
}

module.exports = { loginWithGoogleCredential, register, loginWithGoogleAccess };
