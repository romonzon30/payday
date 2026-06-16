// Central environment access. Reads .env once and exposes a typed-ish config
// object plus helpers. Nothing here throws on import; call validateEnv()
// explicitly at startup.

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const env = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGO_URI || "",
  jwtSecret: process.env.JWT_SECRET || "",
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  corsOrigins: (process.env.CORS_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || process.env.SMTP_USER || "",
  },
};

// Email is only usable when host + credentials are all present.
function isEmailConfigured() {
  return !!(env.smtp.host && env.smtp.user && env.smtp.pass);
}

// Warns (and optionally throws) when required runtime secrets are missing.
function validateEnv({ throwOnMissing = false } = {}) {
  const missing = [];
  if (!env.jwtSecret) missing.push("JWT_SECRET");
  if (!env.googleClientId) missing.push("GOOGLE_CLIENT_ID");
  if (missing.length) {
    const msg = `[ENV] Missing required variables: ${missing.join(", ")}`;
    if (throwOnMissing) throw new Error(msg);
    console.warn(msg);
  }
  return missing;
}

module.exports = { env, isEmailConfigured, validateEnv };
