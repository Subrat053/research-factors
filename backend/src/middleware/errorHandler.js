import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';
import { config } from '../config/index.js';

export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err, req, res, next) => {
  const requestId = req.id || 'unknown';

  // 1. Zod Validation Error
  if (err instanceof ZodError) {
    const details = err.errors.map(e => ({
      path: e.path.join('.'),
      message: e.message
    }));

    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_FAILED',
        message: 'Invalid request data',
        requestId,
        details
      }
    });
  }

  // 2. Prisma Database Errors
  if (err.code === 'P2002') {
    const target = err.meta?.target ? ` (${err.meta.target.join(', ')})` : '';
    return res.status(409).json({
      success: false,
      error: {
        code: 'UNIQUE_CONSTRAINT_VIOLATION',
        message: `A record with this value already exists${target}`,
        requestId
      }
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: {
        code: 'RESOURCE_NOT_FOUND',
        message: 'Target resource does not exist',
        requestId
      }
    });
  }

  // 3. Custom Application Error
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        requestId,
        details: err.details
      }
    });
  }

  // 4. Unexpected / Unhandled Error
  logger.error(`Unhandled Error: ${err.message}`, {
    requestId,
    stack: err.stack,
    path: req.originalUrl,
    method: req.method
  });

  return res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: config.NODE_ENV === 'production' ? 'An internal error occurred' : err.message,
      requestId
    }
  });
};
