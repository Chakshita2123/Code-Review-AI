export const languageColors: Record<string, string> = {
  JavaScript: 'bg-yellow-400',
  TypeScript: 'bg-blue-400',
  Python: 'bg-green-400',
  Java: 'bg-orange-400',
  'C++': 'bg-red-500',
  C: 'bg-zinc-400',
  Go: 'bg-cyan-400',
  Rust: 'bg-orange-500',
  PHP: 'bg-purple-500',
  'C#': 'bg-pink-500',
};

export const SUPPORTED_LANGUAGES = [
  'Java',
  'Python',
  'JavaScript',
  'TypeScript',
  'C++',
  'C',
  'Go',
  'Rust',
  'PHP',
  'C#',
] as const;

export function getLanguageColor(language: string): string {
  return languageColors[language] ?? 'bg-zinc-500';
}
