/**
 * Environment Configuration
 * 
 * Centralizes access to environment variables with fallbacks
 * Supports both client-side (NEXT_PUBLIC_*) and server-side variables
 */

// Check if we're on the server
const isServer = typeof window === 'undefined';

/**
 * Get environment variable with fallback
 * Prioritizes server-side keys over client-side keys for security
 */
export const getEnvVar = (
  key: string,
  fallback: string = '',
  isPublic: boolean = true
): string => {
  // Server-side: Can access both server and client vars
  if (isServer) {
    return process.env[key] || process.env[`NEXT_PUBLIC_${key}`] || fallback;
  }
  
  // Client-side: Only access NEXT_PUBLIC_ vars
  if (isPublic) {
    return process.env[`NEXT_PUBLIC_${key}`] || fallback;
  }
  
  // Client trying to access server-only var
  console.warn(`Attempted to access server-only env var "${key}" from client`);
  return fallback;
};

/**
 * Environment Variables Configuration
 */
export const env = {
  // App Config
  app: {
    url: getEnvVar('APP_URL', 'http://localhost:3000'),
    env: getEnvVar('APP_ENV', 'development'),
    name: getEnvVar('APP_NAME', 'Genesis'),
  },

  // AI Provider API Keys (with fallback to client-side)
  apiKeys: {
    openai: getEnvVar('OPENAI_API_KEY', '', false) || getEnvVar('OPENAI_API_KEY'),
    anthropic: getEnvVar('ANTHROPIC_API_KEY', '', false) || getEnvVar('ANTHROPIC_API_KEY'),
    google: getEnvVar('GOOGLE_CLOUD_API_KEY', '', false) || getEnvVar('GOOGLE_CLOUD_API_KEY'),
    googleProjectId: getEnvVar('GOOGLE_CLOUD_PROJECT_ID', '', false) || getEnvVar('GOOGLE_CLOUD_PROJECT_ID'),
  },

  // Database (server-only)
  database: {
    url: isServer ? process.env.DATABASE_URL || '' : '',
  },

  // Supabase (server-only for service role key)
  supabase: {
    url: getEnvVar('SUPABASE_URL'),
    anonKey: getEnvVar('SUPABASE_ANON_KEY'),
    serviceRoleKey: isServer ? process.env.SUPABASE_SERVICE_ROLE_KEY || '' : '',
  },

  // Auth (server-only)
  auth: {
    nextAuthUrl: isServer ? process.env.NEXTAUTH_URL || '' : '',
    nextAuthSecret: isServer ? process.env.NEXTAUTH_SECRET || '' : '',
  },

  // Feature Flags
  features: {
    enableImageAnalysis: true,
    enableMultipleModels: true,
    enableDarkMode: true,
    enableLocalStorage: true,
  },
};

/**
 * Check if API keys are configured
 */
export const hasApiKey = (provider: 'openai' | 'anthropic' | 'google'): boolean => {
  return !!env.apiKeys[provider];
};

/**
 * Get all configured API keys
 */
export const getConfiguredProviders = (): string[] => {
  const providers: string[] = [];
  if (hasApiKey('openai')) providers.push('OpenAI');
  if (hasApiKey('anthropic')) providers.push('Anthropic');
  if (hasApiKey('google')) providers.push('Google');
  return providers;
};

/**
 * Validate environment configuration
 */
export const validateEnv = (): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check if at least one AI provider is configured
  const hasAnyProvider = hasApiKey('openai') || hasApiKey('anthropic') || hasApiKey('google');
  if (!hasAnyProvider) {
    errors.push('No AI provider API keys configured. Add at least one in Settings or .env.local');
  }

  // Check app URL
  if (!env.app.url) {
    errors.push('NEXT_PUBLIC_APP_URL is not configured');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Log environment status (development only)
 */
export const logEnvStatus = () => {
  if (env.app.env !== 'production') {
    console.log('🔧 Environment Configuration:');
    console.log(`  - Environment: ${env.app.env}`);
    console.log(`  - App URL: ${env.app.url}`);
    console.log(`  - Configured Providers: ${getConfiguredProviders().join(', ') || 'None'}`);
    
    const validation = validateEnv();
    if (!validation.valid) {
      console.warn('⚠️  Environment Warnings:');
      validation.errors.forEach(error => console.warn(`  - ${error}`));
    } else {
      console.log('✅ Environment is properly configured');
    }
  }
};
