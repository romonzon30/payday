// Central error handling.

// Expected, client-facing errors carry an HTTP status. Services throw these;
// the error middleware maps them to a response. Anything else becomes a 500.
class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = "HttpError";
  }
}

// Express error middleware (must keep the 4-arg signature).
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message });
  }
  if (err && err.code === 11000) {
    return res.status(409).json({ message: "Registro duplicado" });
  }
  console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err.message);
  res.status(500).json({ message: "Error interno del servidor" });
}

module.exports = { HttpError, errorHandler };
