import { Router, Request, Response } from 'express';
import { healthRouter } from './health';
import { aiRouter } from './ai';

export const mainRouter = Router();

/**
 * GET /
 * Root service status and welcome message.
 */
mainRouter.get('/', (_req: Request, res: Response): void => {
  res.status(200).json({
    service: 'LearnMate API',
    status: 'running',
    version: '1.0.0',
    description: 'AI-powered personalized learning companion for students',
    endpoints: {
      health: '/api/health',
      aiExplain: 'POST /api/ai/explain',
      aiQuiz: 'POST /api/ai/quiz',
      aiPractice: 'POST /api/ai/practice',
    },
  });
});

/**
 * Mount sub-routers under /api
 */
mainRouter.use('/api/health', healthRouter);
mainRouter.use('/api/ai', aiRouter);
