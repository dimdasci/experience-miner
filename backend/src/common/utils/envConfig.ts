import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(8080),
  
  // Gemini AI Configuration
  API_KEY: z.string().min(1, 'Gemini API key is required'),
  
  // Supabase Configuration (optional for local development)
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_KEY: z.string().optional(),
  
  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type EnvConfig = z.infer<typeof envSchema>;

function validateEnv(): EnvConfig {
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

export const env = validateEnv();

// Log configuration in development
if (env.NODE_ENV === 'development') {
  console.log('🔧 Environment configuration:');
  console.log(`  - NODE_ENV: ${env.NODE_ENV}`);
  console.log(`  - PORT: ${env.PORT}`);
  console.log(`  - LOG_LEVEL: ${env.LOG_LEVEL}`);
  console.log(`  - API_KEY: ${env.API_KEY ? '✅ Set' : '❌ Missing'}`);
  console.log(`  - SUPABASE_URL: ${env.SUPABASE_URL ? '✅ Set' : '⚠️  Optional (not set)'}`);
  console.log(`  - SUPABASE_SERVICE_KEY: ${env.SUPABASE_SERVICE_KEY ? '✅ Set' : '⚠️  Optional (not set)'}`);
}