import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  // Railway provides environment name, fallback to development for local dev
  RAILWAY_ENVIRONMENT_NAME: z.string().optional(),
  PORT: z.coerce.number().int().positive().default(8080),
  
  // Gemini AI Configuration
  API_KEY: z.string().min(1, 'Gemini API key is required'),
  
  // CORS Configuration - Frontend URL (set via Railway service reference)
  FRONTEND_URL: z.string().optional(),
  
  // Railway Configuration (automatically provided by Railway)
  RAILWAY_PUBLIC_DOMAIN: z.string().optional(),
  
  // Supabase Configuration (optional for local development)
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_KEY: z.string().optional(),
  
  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

type BaseEnvConfig = z.infer<typeof envSchema>;

function validateEnv(): BaseEnvConfig {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(
        (err) => `${err.path.join('.')}: ${err.message}`
      );
      
      console.error('❌ Environment validation failed:');
      errorMessages.forEach((msg) => console.error(`  - ${msg}`));
      process.exit(1);
    }
    
    console.error('❌ Unexpected error during environment validation:', error);
    process.exit(1);
  }
}

const baseEnv = validateEnv();

// Use Railway environment name or default to development for local
const NODE_ENV = baseEnv.RAILWAY_ENVIRONMENT_NAME || 'development';

export const env = {
  ...baseEnv,
  NODE_ENV,
  isDevelopment: NODE_ENV === 'development',
  isProduction: NODE_ENV === 'production',
};

export type EnvConfig = typeof env;

// Log configuration 
console.log('🔧 Environment configuration:');
console.log(`  - RAILWAY_ENVIRONMENT_NAME: ${env.RAILWAY_ENVIRONMENT_NAME || '⚠️  Not set (local dev)'}`);
console.log(`  - NODE_ENV: ${env.NODE_ENV}`);
console.log(`  - PORT: ${env.PORT}`);
console.log(`  - LOG_LEVEL: ${env.LOG_LEVEL}`);
console.log(`  - API_KEY: ${env.API_KEY ? '✅ Set' : '❌ Missing'}`);
console.log(`  - FRONTEND_URL: ${env.FRONTEND_URL || '⚠️  Not set (using localhost)'}`);
console.log(`  - RAILWAY_PUBLIC_DOMAIN: ${env.RAILWAY_PUBLIC_DOMAIN || '⚠️  Not set (local dev)'}`);
console.log(`  - SUPABASE_URL: ${env.SUPABASE_URL ? '✅ Set' : '⚠️  Optional (not set)'}`);
console.log(`  - SUPABASE_SERVICE_KEY: ${env.SUPABASE_SERVICE_KEY ? '✅ Set' : '⚠️  Optional (not set)'}`);

if (env.NODE_ENV !== 'development' && !env.FRONTEND_URL) {
  console.warn('⚠️  FRONTEND_URL not set in deployed environment - CORS will be disabled');
}