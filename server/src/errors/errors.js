/**
 * Base Application Error (TRD v2.0 Section 19)
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_SERVER_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

export class AuthorizationError extends AppError {
  constructor(message = 'Access forbidden') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'RESOURCE_NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict detected') {
    super(message, 409, 'RESOURCE_CONFLICT');
  }
}

export class ExternalServiceError extends AppError {
  constructor(message = 'External service integration error') {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR');
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Rate limit exceeded. Please slow down.') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}
