import { createApp } from './app';
import { env } from './config/env';

/**
 * Server entrypoint for LearnMate backend.
 *
 * Cloud Run & Production notes:
 * - Google Cloud Run provides the PORT environment variable dynamically and expects
 *   the server to listen on host 0.0.0.0.
 * - Handles SIGTERM/SIGINT for graceful shutdown during container lifecycle updates.
 */
const startServer = (): void => {
  const app = createApp();
  const HOST = '0.0.0.0';
  const PORT = env.PORT;

  const server = app.listen(PORT, HOST, () => {
    console.log('====================================================');
    console.log(`🚀 LearnMate Backend running in [${env.NODE_ENV}] mode`);
    console.log(`📡 Listening on: http://${HOST}:${PORT}`);
    console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
    console.log(`🌐 Allowed CORS: ${env.CORS_ORIGIN}`);
    console.log('====================================================');
  });

  // Graceful shutdown handling (essential for Google Cloud Run scale-down)
  const shutdown = (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
    server.close(() => {
      console.log('✅ Server closed cleanly. Process terminating.');
      process.exit(0);
    });

    // Force shutdown after 10s if connections fail to close in time
    setTimeout(() => {
      console.error('⚠️ Forcefully terminating server after timeout.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

startServer();
