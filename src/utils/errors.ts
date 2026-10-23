/**
 * Custom application error class to handle operational errors with HTTP status codes.
 *
 * Operational errors are predictable errors (e.g., 400 Bad Request, 404 Not Found)
 * as opposed to programming bugs or unexpected runtime crashes.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown (V8 only)
    Error.captureStackTrace(this, this.constructor);
  }
}
