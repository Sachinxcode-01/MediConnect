import { AppError } from '../errors/errors.js';

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected error occurred';

  // Log error safely in non-production environments
  if (process.env.NODE_ENV !== 'production') {
    console.error('API Error Trace:', err);
  }

  // Handle specific database/ORM errors
  if (err.name === 'CastError') {
    statusCode = 404;
    errorCode = 'RESOURCE_NOT_FOUND';
    message = 'Requested resource not found';
  }

  if (err.code === 11000) {
    statusCode = 409;
    errorCode = 'RESOURCE_CONFLICT';
    message = 'Duplicate entry detected';
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    message = Object.values(err.errors || {}).map(val => val.message).join(', ') || message;
  }

  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'AUTHENTICATION_ERROR';
    message = 'Invalid authentication token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'AUTHENTICATION_ERROR';
    message = 'Authentication token expired';
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: message
    }
  });
};

export default errorHandler;
