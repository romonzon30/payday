// Builds and configures the Express app (no network/DB side effects).
// index.js wires this to the DB and starts listening; tests mount it directly.

const express = require("express");
const cors = require("cors");
const { env } = require("./config/env");
const { errorHandler } = require("./middleware/errorHandler");

function createApp() {
  const app = express();

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
  app.use(express.json());

  app.use("/api/auth", require("./routes/auth"));
  app.use("/api/user", require("./routes/user"));
  app.use("/api/impuestos", require("./routes/impuestos"));

  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
