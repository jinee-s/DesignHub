/**
 * Environment Configuration
 * 
 * WHY: Separate configs for dev/staging/production
 * - Easy to switch between environments
 * - Type-safe environment variables
 * - Prevents errors from missing env vars
 * 
 * Used by: All professional apps (Vercel pattern, Create React App pattern)
 */

interface Config {
  apiUrl: string;
  environment: 'development' | 'staging' | 'production';
  isDevelopment: boolean;
  isProduction: boolean;
}

const config: Config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  environment: (import.meta.env.VITE_ENV || 'development') as Config['environment'],
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

// Validate required environment variables
if (!config.apiUrl) {
  throw new Error('VITE_API_URL is required');
}

export default config;
