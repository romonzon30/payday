// Builds and configures the Express app (no network/DB side effects).
// index.js wires this to the DB and starts listening; tests mount it directly.

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { env } = require("./config/env");
const { errorHandler } = require("./middleware/errorHandler");

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.corsOrigins.length === 0 || env.corsOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error("CORS blocked"));
      },
    })
  );
  app.use(express.json({ limit: "100kb" }));

  // Throttle the public auth endpoints to limit brute-force / abuse.
  const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use("/api/auth", authLimiter, require("./routes/auth"));
  app.use("/api/user", require("./routes/user"));
  app.use("/api/impuestos", require("./routes/impuestos"));

  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
