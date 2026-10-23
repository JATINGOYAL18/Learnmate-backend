import { Request, Response, NextFunction } from 'express';
import { ZodTypeAny } from 'zod';

export interface RequestValidators {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

/**
 * Higher-order middleware function that validates incoming requests against Zod schemas.
 *
 * Can validate req.body, req.query, and req.params simultaneously or individually.
 * If validation fails, Zod throws a ZodError which is forwarded to the centralized errorHandler.
 *
 * @example
 * const createItemSchema = z.object({ title: z.string().min(1) });
 * router.post('/items', validateRequest({ body: createItemSchema }), itemController.create);
 */
export const validateRequest = (validators: RequestValidators) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (validators.body) {
        req.body = (await validators.body.parseAsync(req.body)) as Request['body'];
      }
      if (validators.query) {
        req.query = (await validators.query.parseAsync(req.query)) as unknown as Request['query'];
      }
      if (validators.params) {
        req.params = (await validators.params.parseAsync(req.params)) as unknown as Request['params'];
      }
      next();
    } catch (error) {
      // Passes the ZodError straight to the centralized error handler
      next(error);
    }
  };
};
