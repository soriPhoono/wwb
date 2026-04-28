// Global Error Handler Middleware
// Express 5.x automatically passes unhandled Promise rejections to this middleware.

export const errorHandler = (err, req, res, next) => {
  console.error("Unhandled Error:", err);

  // Mongoose Validation Error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({ error: messages.join(", ") });
  }

  // Mongoose Cast Error (e.g. invalid ObjectId)
  if (err.name === "CastError") {
    return res.status(400).json({ error: "Invalid ID format." });
  }

  // MongoDB Duplicate Key Error
  if (err.code === 11000) {
    return res.status(409).json({ error: "Duplicate field value entered." });
  }

  // Default Error Response
  const statusCode = err.statusCode || 500;
  const message = err.message || "Server error. Please try again later.";

  res.status(statusCode).json({
    error: message,
    // Provide stack trace in development, but NOT in production
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
};
