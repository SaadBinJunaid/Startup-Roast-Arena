// middleware/errorMiddleware.js
// Responsibility: handle errors and unknown routes in ONE central place.
// Instead of repeating error responses in every controller, controllers can
// call next(error) and let these two functions decide what to send back.

// 1) notFound - runs when no route matched the request.
export function notFound(req, res, next) {
  const error = new Error(`Route not found: ${req.originalUrl}`);

  // Mark the response as 404 so errorHandler below keeps that status.
  res.status(404);
  next(error);
}

// 2) errorHandler - Express recognises this as an error handler because it
// has FOUR parameters (err, req, res, next). It must be added LAST in index.js.
export function errorHandler(err, req, res, next) {
  // Prefer an explicit statusCode on the error (AI errors use 502/503).
  // Otherwise keep a 4xx status a controller already set, else use 500.
  let statusCode = 500;

  if (err.statusCode && err.statusCode >= 400) {
    statusCode = err.statusCode;
  } else if (res.statusCode && res.statusCode >= 400) {
    statusCode = res.statusCode;
  }

  res.status(statusCode).json({
    message: err.message || "Something went wrong on the server",
    // Only show the technical stack trace outside production.
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
}
