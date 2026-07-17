/**
 * Environment variable validation.
 * Called once at DB connection time to fail fast on misconfiguration.
 */

const REQUIRED_ENV_VARS = [
  'MONGODB_URI',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'NEXTAUTH_SECRET',
  'NEXTAUTH_URL',
  'GEMINI_API_KEY',
] as const;

let validated = false;

/**
 * Throws if any required environment variable is missing.
 * Safe to call multiple times — only validates once.
 */
export function validateEnv(): void {
  if (validated) return;

  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]?.trim());

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`,
    );
  }

  validated = true;
}
