import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Environment Configuration', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    // Clear modules cache to test fresh environment loading
    vi.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should validate required environment variables', async () => {
    // Set valid environment
    process.env.NODE_ENV = 'test';
    process.env.PORT = '8080';
    process.env.API_KEY = 'valid_api_key';
    
    const { env } = await import('./envConfig.js');
    
    expect(env.NODE_ENV).toBe('test');
    expect(env.PORT).toBe(8080);
    expect(env.API_KEY).toBe('valid_api_key');
    expect(env.LOG_LEVEL).toBe('info'); // default value
  });

  it('should use default values for optional fields', async () => {
    process.env.NODE_ENV = 'development';
    process.env.API_KEY = 'test_key';
    // Don't set PORT and LOG_LEVEL
    
    const { env } = await import('./envConfig.js');
    
    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(8080); // default
    expect(env.LOG_LEVEL).toBe('info'); // default
    expect(env.API_KEY).toBe('test_key');
  });

  it('should fail validation when API_KEY is missing', async () => {
    process.env.NODE_ENV = 'test';
    delete process.env.API_KEY;
    
    // Mock console.error and process.exit to avoid actual exit
    const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockProcessExit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('Process.exit called');
    });

    await expect(async () => {
      await import('./envConfig.js');
    }).rejects.toThrow('Process.exit called');

    expect(mockConsoleError).toHaveBeenCalledWith('❌ Environment validation failed:');
    expect(mockProcessExit).toHaveBeenCalledWith(1);
    
    mockConsoleError.mockRestore();
    mockProcessExit.mockRestore();
  });

  it('should validate NODE_ENV enum values', async () => {
    process.env.NODE_ENV = 'invalid';
    process.env.API_KEY = 'test_key';
    
    const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockProcessExit = vi.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('Process.exit called');
    });

    await expect(async () => {
      await import('./envConfig.js');
    }).rejects.toThrow('Process.exit called');

    expect(mockProcessExit).toHaveBeenCalledWith(1);
    
    mockConsoleError.mockRestore();
    mockProcessExit.mockRestore();
  });

  it('should coerce PORT to number', async () => {
    process.env.NODE_ENV = 'test';
    process.env.PORT = '3000';
    process.env.API_KEY = 'test_key';
    
    const { env } = await import('./envConfig.js');
    
    expect(env.PORT).toBe(3000);
    expect(typeof env.PORT).toBe('number');
  });

  it('should validate LOG_LEVEL enum values', async () => {
    process.env.NODE_ENV = 'test';
    process.env.API_KEY = 'test_key';
    process.env.LOG_LEVEL = 'debug';
    
    const { env } = await import('./envConfig.js');
    
    expect(env.LOG_LEVEL).toBe('debug');
  });

  it('should handle optional Supabase configuration', async () => {
    process.env.NODE_ENV = 'test';
    process.env.API_KEY = 'test_key';
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_KEY = 'test_service_key';
    
    const { env } = await import('./envConfig.js');
    
    expect(env.SUPABASE_URL).toBe('https://test.supabase.co');
    expect(env.SUPABASE_SERVICE_KEY).toBe('test_service_key');
  });
});