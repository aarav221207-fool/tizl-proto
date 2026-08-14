import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default('https://tizl.in'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().default('https://placeholder-project.supabase.co'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).default('placeholder-anon-key'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().default('placeholder-service-role-key'),
  
  PAYTM_MID: z.string().optional().default(''),
  PAYTM_MERCHANT_KEY: z.string().optional().default(''),
  PAYTM_WEBSITE: z.string().optional().default('DEFAULT'),
  PAYTM_ENVIRONMENT: z.enum(['staging', 'production']).default('staging'),
  PAYTM_CALLBACK_URL: z.string().optional().default(''),

  DIGILOCKER_CLIENT_ID: z.string().optional().default(''),
  DIGILOCKER_CLIENT_SECRET: z.string().optional().default(''),

  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
});

function parseEnv() {
  const result = envSchema.safeParse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'https://tizl.in',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    PAYTM_MID: process.env.PAYTM_MID,
    PAYTM_MERCHANT_KEY: process.env.PAYTM_MERCHANT_KEY,
    PAYTM_WEBSITE: process.env.PAYTM_WEBSITE,
    PAYTM_ENVIRONMENT: process.env.PAYTM_ENVIRONMENT,
    PAYTM_CALLBACK_URL: process.env.PAYTM_CALLBACK_URL,
    DIGILOCKER_CLIENT_ID: process.env.DIGILOCKER_CLIENT_ID,
    DIGILOCKER_CLIENT_SECRET: process.env.DIGILOCKER_CLIENT_SECRET,
    NODE_ENV: process.env.NODE_ENV,
  });

  if (!result.success) {
    console.error('Invalid environment variables:', result.error.flatten().fieldErrors);
    throw new Error('Invalid environment variables');
  }

  return result.data;
}

export const env = parseEnv();
