import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables before parsing
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive())
    .default('5000'),

  // Database & Cache
  MONGODB_URI: z.string().url().default('mongodb://127.0.0.1:27017/mediconnect'),
  REDIS_URI: z.string().url().default('redis://127.0.0.1:6379'),

  // Security & JWT
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long').default('temporary-super-secret-jwt-key-min-16-chars'),
  JWT_REFRESH_SECRET: z.string().optional(),

  // AI & Integrations
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().default('anthropic/claude-3.5-sonnet'),
  GEMINI_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),

  // Storage
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  // URLs & Networking
  CLIENT_URL: z.string().default('http://localhost:5173'),
  VITE_API_URL: z.string().default('http://localhost:5000'),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment variables configuration:');
    console.error(JSON.stringify(result.error.format(), null, 2));
    throw new Error('Fatal: Invalid environment variables. Process terminated.');
  }
  return result.data;
};

export const env = parseEnv();
export type Env = z.infer<typeof envSchema>;
