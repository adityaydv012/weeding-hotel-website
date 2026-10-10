import { ZodError } from 'zod';
import { ApiError } from '../utils/apiError.js';

export function notFound(req, _res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(err, req, res, _next) {
  let status = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details;

  if (err instanceof ZodError) {
    status = 400;
    message = 'Validation failed';
    details = err.issues;
  }
  if (err?.code === 11000) {
    status = 409;
    message = 'A resource with this unique value already exists';
    details = err.keyValue;
  }

  const body = { success: false, message };
  if (details) body.details = details;
  if (process.env.NODE_ENV !== 'production') body.stack = err.stack;
  res.status(status).json(body);
}
