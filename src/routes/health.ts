import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { env } from '../config/env';
import { validateRequest } from '../middleware/validate';

export const healthRouter = Router();

/**
 * Example Zod schema for query validation on the health endpoint.
 * Demonstrates request validation patterns in a lightweight way.
 */
const healthQuerySchema = z.object({
  verbose: z.enum(['true', 'false']).optional(),
});

/**
 * GET /api/health
 * Returns service status, uptime, and system diagnostics.
 */
healthRouter.get(
  '/',
  validateRequest({ query: healthQuerySchema }),
  (req: Request, res: Response): void => {
    const isVerbose = req.query.verbose === 'true';

    const healthData: Record<string, unknown> = {
      status: 'ok',
      service: 'learnmate-backend',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: env.NODE_ENV,
    };

    if (isVerbose) {
      healthData.diagnostics = {
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage(),
      };
    }

    res.status(200).json(healthData);
  }
);
