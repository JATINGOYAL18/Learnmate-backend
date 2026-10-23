import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { env } from '../config/env';

/**
 * Centralized error-handling middleware.
 * In Express, error-handling middleware MUST accept 4 arguments (err, req, res, next)
 * so Express knows it is an error handler.
 */
export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Handle Zod Schema Validation Errors
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data provided.',
        details: err.errors.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      },
    });
    return;
  }

  // Handle Known Operational Application Errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: 'APP_ERROR',
        message: err.message,
      },
    });
    return;
  }

  // Handle Unexpected Runtime Errors
  const isDev = env.NODE_ENV === 'development';
  const errorMessage = err instanceof Error ? err.message : 'Internal Server Error';

  console.error(`[Unhandled Error] ${req.method} ${req.originalUrl}:`, err);

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isDev ? errorMessage : 'An unexpected error occurred. Please try again later.',
      ...(isDev && err instanceof Error ? { stack: err.stack } : {}),
    },
  });
};
