const { ZodError } = require("zod");
const AppError = require("../utils/AppError");

function notFound(req, res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
}

function errorHandler(error, req, res, next) { // eslint-disable-line no-unused-vars
  let status = error.statusCode || 500;
  let message = error.message || "Internal server error";
  let errors = error.errors || [];
  if (error instanceof ZodError) {
    status = 422;
    message = "Validation failed";
    errors = error.issues.map((issue) => ({ field: issue.path.join("."), message: issue.message }));
  } else if (error.name === "ValidationError") {
    status = 422;
    message = "Validation failed";
    errors = Object.values(error.errors).map((item) => ({ field: item.path, message: item.message }));
  } else if (error.code === 11000) {
    status = 409;
    message = "A record with that value already exists";
  } else if (error.name === "CastError") {
    status = 422;
    message = `Invalid ${error.path}`;
  } else if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
    status = 401;
    message = "Invalid or expired authentication token";
  }
  if (status >= 500 && process.env.NODE_ENV === "production") message = "Internal server error";
  res.status(status).json({ success: false, message, errors });
}

module.exports = { notFound, errorHandler };
