export interface IUser {
  id: string;
  name: string;
  email: string;
  image?: string;
  provider: string;
  reviewsCompleted: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IDeveloperReport {
  overallScore: number;
  bugsFound: number;
  performance: number;
  readability: number;
  security: number;
  timeComplexity: string;
  spaceComplexity: string;
  topRecommendation: string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  bugDetails: string[];
  bestPractices: string[];
  namingSuggestions: string[];
  securityIssues: string[];
  suggestedImprovements: string[];
  finalVerdict: string;
}

export interface IApproach {
  title: string;
  description: string;
  difficulty: 'Easy' | 'Medium' | 'Advanced';
  improvements: string[];
  code: string;
}

export type SupportedLanguage =
  | 'Java'
  | 'Python'
  | 'JavaScript'
  | 'TypeScript'
  | 'C++'
  | 'C'
  | 'Go'
  | 'Rust'
  | 'PHP'
  | 'C#';

export interface IReview {
  id: string;
  userId: string;
  language: SupportedLanguage;
  originalCode: string;
  improvedCode?: string;
  report: IDeveloperReport;
  isFavorited: boolean;
  isRoastMode?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ReviewFeedback {
  summary: string;
  score: number;
  bugs: string[];
  performance: string[];
  readability: string[];
  security: string[];
  timeComplexity: string;
  spaceComplexity: string;
  topRecommendation: string;
  improvedCode: string;
}
