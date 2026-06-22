const authService = require("../services/authService");

async function google(req, res) {
  res.json(await authService.loginWithGoogleCredential(req.body.credential));
}

async function register(req, res) {
  res.json(await authService.register(req.body));
}

async function googleAccess(req, res) {
  res.json(await authService.loginWithGoogleAccess(req.body));
}

module.exports = { google, register, googleAccess };
