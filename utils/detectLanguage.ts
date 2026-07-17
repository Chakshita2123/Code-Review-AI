import type { SupportedLanguage } from '@/types';

/**
 * Language detection patterns — ordered by specificity.
 * Each entry maps a set of regex patterns to a language.
 */
const DETECTION_RULES: Array<{ patterns: RegExp[]; language: SupportedLanguage }> = [
  // Rust (very distinctive syntax)
  { patterns: [/\bfn\s+\w+\s*\(/, /\blet\s+mut\b/, /\bimpl\s+/, /\b->\s*\w+/], language: 'Rust' },
  // Go (distinctive := and func keyword)
  { patterns: [/\bfunc\s+\w+\s*\(/, /:=\s*/, /\bpackage\s+\w+/], language: 'Go' },
  // Java (public class, System.out, etc.)
  { patterns: [/\bpublic\s+class\b/, /System\.out\.print/, /\bpublic\s+static\s+void\s+main\b/], language: 'Java' },
  // C# (using System, namespace, Console.Write)
  { patterns: [/\busing\s+System\b/, /\bnamespace\s+\w+/, /Console\.Write/], language: 'C#' },
  // C++ (#include with <iostream>, std::, cout)
  { patterns: [/#include\s*<\w+>/, /\bstd::/, /\bcout\s*<</, /\busing\s+namespace\s+std/], language: 'C++' },
  // C (#include with .h, printf, malloc)
  { patterns: [/#include\s*<\w+\.h>/, /\bprintf\s*\(/, /\bmalloc\s*\(/, /\bvoid\s*\*/], language: 'C' },
  // PHP (<?php, $variable, ->)
  { patterns: [/<\?php/, /\$\w+\s*=/, /\bfunction\s+\w+\s*\(/], language: 'PHP' },
  // Python (def, import at start of line, self., print())
  { patterns: [/^def\s+\w+\s*\(/m, /^import\s+\w+/m, /^from\s+\w+\s+import/m, /\bself\.\w+/], language: 'Python' },
  // TypeScript (type annotations, interface, : string, : number)
  { patterns: [/:\s*(string|number|boolean|void)\b/, /\binterface\s+\w+/, /\b<\w+>\s*\(/, /\bas\s+\w+/], language: 'TypeScript' },
  // JavaScript (fallback for const/let/var with arrow functions, require())
  { patterns: [/\bconst\s+\w+\s*=/, /=>\s*{/, /\brequire\s*\(/, /\bmodule\.exports/], language: 'JavaScript' },
];

/**
 * Minimum number of pattern matches required to consider a detection confident.
 */
const MIN_CONFIDENCE_MATCHES = 1;

/**
 * Detect the programming language of a code snippet based on syntax patterns.
 *
 * @param code - The source code to analyze
 * @param fallback - The language to return if no patterns match
 * @returns The detected SupportedLanguage, or the fallback
 */
export function detectLanguage(code: string, fallback: SupportedLanguage = 'JavaScript'): SupportedLanguage {
  if (!code.trim()) return fallback;

  let bestMatch: SupportedLanguage | null = null;
  let bestScore = 0;

  for (const rule of DETECTION_RULES) {
    const matchCount = rule.patterns.filter((pattern) => pattern.test(code)).length;
    if (matchCount >= MIN_CONFIDENCE_MATCHES && matchCount > bestScore) {
      bestScore = matchCount;
      bestMatch = rule.language;
    }
  }

  return bestMatch ?? fallback;
}
