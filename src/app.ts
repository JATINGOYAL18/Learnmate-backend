import express, { Application } from 'express';
import cors from 'cors';
import { env } from './config/env';
import { mainRouter } from './routes';
import { notFoundHandler } from './middleware/notFound';
import { errorHandler } from './middleware/errorHandler';

/**
 * Creates and configures the Express application.
 * Isolating 'app' from 'server.listen' enables seamless automated integration testing.
 */
export const createApp = (): Application => {
  const app = express();

  // 1. Cross-Origin Resource Sharing (CORS)
  const allowedOrigins =
    env.CORS_ORIGIN === '*'
      ? '*'
      : env.CORS_ORIGIN.split(',').map((origin) => origin.trim());

  app.use(
    cors({
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // 2. Request Parsers
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 3. Mount Routes
  app.use('/', mainRouter);

  // 4. Handle 404 for unmatched routes
  app.use(notFoundHandler);

  // 5. Centralized Error Handling (must be last middleware)
  app.use(errorHandler);

  return app;
};
