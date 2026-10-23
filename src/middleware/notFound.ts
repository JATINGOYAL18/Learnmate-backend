import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to capture requests to unknown routes and respond with a consistent 404 JSON structure.
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `The requested resource '${req.method} ${req.originalUrl}' does not exist on this server.`,
    },
  });
};
