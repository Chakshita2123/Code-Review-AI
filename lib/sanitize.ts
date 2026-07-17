/**
 * Input sanitization helpers used across all API routes.
 * Strips dangerous bytes, enforces length limits, and validates enumerables.
 */

const SUPPORTED_LANGUAGES = [
  'JavaScript',
  'TypeScript',
  'Python',
  'Java',
  'C++',
  'C',
  'Go',
  'Rust',
  'PHP',
  'C#',
] as const;

export type SupportedLanguageLiteral = (typeof SUPPORTED_LANGUAGES)[number];

/**
 * Sanitize user-submitted source code.
 * - Removes null bytes (can cause issues in some parsers)
 * - Enforces 50,000 character hard limit
 * - Trims surrounding whitespace
 */
export function sanitizeCode(code: string): string {
  if (typeof code !== 'string') {
    throw new Error('Code must be a string');
  }

  // Remove null bytes
  const cleaned = code.replace(/\0/g, '');

  if (cleaned.length > 50_000) {
    throw new Error('Code exceeds maximum length of 50,000 characters');
  }

  return cleaned.trim();
}

/**
 * Sanitize a chat message.
 * - Removes null bytes
 * - Enforces 5,000 character hard limit
 * - Trims surrounding whitespace
 *
 * NOTE: We intentionally do NOT HTML-escape here because messages are rendered
 * as plain text / Markdown — escaping <, >, & etc. would corrupt the output.
 */
export function sanitizeMessage(message: string): string {
  if (typeof message !== 'string') {
    throw new Error('Message must be a string');
  }

  const cleaned = message.replace(/\0/g, '');

  if (cleaned.length > 5_000) {
    throw new Error('Message exceeds maximum length of 5,000 characters');
  }

  return cleaned.trim();
}

/**
 * Validate that a language string is in the supported allowlist.
 */
export function validateLanguage(language: string): boolean {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(language);
}
