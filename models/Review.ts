import mongoose, { Schema, Document, Types, model, models } from 'mongoose';

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

export interface IReview extends Document {
  userId: Types.ObjectId;
  language: SupportedLanguage;
  originalCode: string;
  improvedCode?: string;
  report: IDeveloperReport;
  isFavorited: boolean;
  isRoastMode?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const supportedLanguages: SupportedLanguage[] = [
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
];

const reportSchema = new Schema<IDeveloperReport>(
  {
    overallScore: { type: Number, min: 0, max: 100, required: true },
    bugsFound: { type: Number, required: true },
    performance: { type: Number, min: 0, max: 10, required: true },
    readability: { type: Number, min: 0, max: 10, required: true },
    security: { type: Number, min: 0, max: 10, required: true },
    timeComplexity: { type: String, required: true },
    spaceComplexity: { type: String, required: true },
    topRecommendation: { type: String, required: true },
    summary: { type: String, required: true },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    bugDetails: { type: [String], default: [] },
    bestPractices: { type: [String], default: [] },
    namingSuggestions: { type: [String], default: [] },
    securityIssues: { type: [String], default: [] },
    suggestedImprovements: { type: [String], default: [] },
    finalVerdict: { type: String, required: true },
  },
  { _id: false },
);

const ReviewSchema = new Schema<IReview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    language: { type: String, required: true, enum: supportedLanguages },
    originalCode: { type: String, required: true },
    improvedCode: { type: String },
    report: { type: reportSchema, required: true },
    isFavorited: { type: Boolean, default: false },
    isRoastMode: { type: Boolean, default: false },
  },
  { timestamps: true },
);

ReviewSchema.index({ userId: 1, createdAt: -1 });
ReviewSchema.index({ userId: 1, isFavorited: 1 });   // favorites filter
ReviewSchema.index({ userId: 1, language: 1 });       // language filter

const Review = (models.Review as mongoose.Model<IReview>) || model<IReview>('Review', ReviewSchema);

export default Review;
