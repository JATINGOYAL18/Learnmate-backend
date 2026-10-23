import { Router, Request, Response, NextFunction } from 'express';
import { validateRequest } from '../middleware/validate';
import {
  explainRequestSchema,
  quizRequestSchema,
  practiceRequestSchema,
} from '../services/ai.schemas';
import { GeminiService, geminiService } from '../services/gemini.service';

/**
 * Creates the AI router. Accepts an optional GeminiService instance
 * for easy dependency injection in automated tests.
 */
export const createAiRouter = (service: GeminiService = geminiService): Router => {
  const router = Router();

  /**
   * POST /api/ai/explain
   * Explains a concept or topic strictly grounded in provided study material.
   */
  router.post(
    '/explain',
    validateRequest({ body: explainRequestSchema }),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const result = await service.explain(req.body);
        res.status(200).json({
          success: true,
          data: result,
        });
      } catch (err) {
        next(err);
      }
    }
  );

  /**
   * POST /api/ai/quiz
   * Generates a multiple-choice quiz strictly grounded in provided study material.
   */
  router.post(
    '/quiz',
    validateRequest({ body: quizRequestSchema }),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const result = await service.quiz(req.body);
        res.status(200).json({
          success: true,
          data: result,
        });
      } catch (err) {
        next(err);
      }
    }
  );

  /**
   * POST /api/ai/practice
   * Generates practice items (flashcards/exercises) strictly grounded in provided study material.
   */
  router.post(
    '/practice',
    validateRequest({ body: practiceRequestSchema }),
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const result = await service.practice(req.body);
        res.status(200).json({
          success: true,
          data: result,
        });
      } catch (err) {
        next(err);
      }
    }
  );

  return router;
};

export const aiRouter = createAiRouter();
