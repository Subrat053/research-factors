import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  APP_URL: z.string().url().default('http://localhost:5173'),
  API_URL: z.string().url().default('http://localhost:5000'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  STORAGE_PROVIDER: z.enum(['local', 'cloudinary', 'r2']).default('local'),
  LOCAL_STORAGE_PATH: z.string().default('./uploads'),
  LOCAL_STORAGE_PUBLIC_URL: z.string().optional(),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),

  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_PUBLIC_URL: z.string().optional(),

  EMAIL_PROVIDER: z.enum(['smtp', 'json_log']).default('json_log'),
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().default(1025),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_FROM_EMAIL: z.string().email().default('noreply@researchfactors.com'),
  SMTP_FROM_NAME: z.string().default('Research Factors'),

  REDIS_URL: z.string().optional()
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment configuration:', JSON.stringify(result.error.format(), null, 2));
    process.exit(1);
  }
  const data = result.data;
  if (!data.LOCAL_STORAGE_PUBLIC_URL) {
    data.LOCAL_STORAGE_PUBLIC_URL = `${data.API_URL.replace(/\/+$/, '')}/uploads`;
  } else {
    data.LOCAL_STORAGE_PUBLIC_URL = data.LOCAL_STORAGE_PUBLIC_URL.replace(/\/+$/, '');
  }
  return data;
};

export const config = parseEnv();
