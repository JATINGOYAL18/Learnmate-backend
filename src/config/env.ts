import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file (if present)
dotenv.config();

/**
 * Zod schema to validate and sanitize environment variables.
 * Using Zod here ensures that configuration errors are caught immediately
 * when the server boots up, rather than failing unexpectedly at runtime.
 */
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Critical Error: Invalid environment configuration:');
  console.error(parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
