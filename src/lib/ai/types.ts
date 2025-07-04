import { z } from 'zod';

// Content Moderation
export const contentModerationSchema = z.object({
  contentId: z.string(),
  contentType: z.enum(['campaign', 'comment', 'update']),
  safetyScore: z.number().min(0).max(1),
  qualityScore: z.number().min(0).max(1),
  flaggedIssues: z.array(z.string()),
  moderationStatus: z.enum(['approved', 'rejected', 'manual_review']),
});

export type ContentModeration = z.infer<typeof contentModerationSchema>;

// Content Suggestion
export const contentSuggestionSchema = z.object({
  campaignId: z.string(),
  suggestionType: z.enum(['location-based', 'interest-based', 'trending']),
  content: z.string(),
  confidence: z.number().min(0).max(1),
  isApplied: z.boolean().default(false),
});

export type ContentSuggestion = z.infer<typeof contentSuggestionSchema>;

// Campaign Summary
export const campaignSummarySchema = z.object({
  campaignId: z.string(),
  shortSummary: z.string().max(200),
  fullSummary: z.string().max(1000),
  keyPoints: z.array(z.string()).max(5),
});

export type CampaignSummary = z.infer<typeof campaignSummarySchema>;

// Sentiment Analysis
export const sentimentAnalysisSchema = z.object({
  contentId: z.string(),
  contentType: z.enum(['campaign', 'comment', 'update']),
  sentiment: z.number().min(-1).max(1),
  emotions: z.record(z.string(), z.number()),
  keywords: z.array(z.string()),
});

export type SentimentAnalysis = z.infer<typeof sentimentAnalysisSchema>;

// Translation
export const translationSchema = z.object({
  contentId: z.string(),
  contentType: z.enum(['campaign', 'comment', 'update']),
  sourceLanguage: z.string(),
  targetLanguage: z.string(),
  originalText: z.string(),
  translatedText: z.string(),
});

export type Translation = z.infer<typeof translationSchema>;

// Accessibility Enhancement
export const accessibilityEnhancementSchema = z.object({
  contentId: z.string(),
  contentType: z.enum(['image', 'video', 'audio']),
  altText: z.string().optional(),
  audioDescription: z.string().optional(),
  transcription: z.string().optional(),
});

export type AccessibilityEnhancement = z.infer<
  typeof accessibilityEnhancementSchema
>;

// AI Service Request/Response Types
export const generateSuggestionRequestSchema = z.object({
  campaignId: z.string(),
  suggestionType: z.enum(['location-based', 'interest-based', 'trending']),
});

export const moderateContentRequestSchema = z.object({
  contentId: z.string(),
  contentType: z.enum(['campaign', 'comment', 'update']),
  content: z.string(),
});

export const generateSummaryRequestSchema = z.object({
  campaignId: z.string(),
  includeComments: z.boolean().optional().default(false),
  includeVotes: z.boolean().optional().default(true),
});

export const analyzeImageRequestSchema = z.object({
  contentId: z.string(),
  imageUrl: z.string().url(),
});

export const translateContentRequestSchema = z.object({
  contentId: z.string(),
  contentType: z.enum(['campaign', 'comment', 'update']),
  targetLanguage: z.string(),
  sourceLanguage: z.string().optional().default('auto'),
});

export const analyzeSentimentRequestSchema = z.object({
  contentId: z.string(),
  contentType: z.enum(['campaign', 'comment', 'update']),
  content: z.string(),
});

// Batch processing schemas
export const batchModerationRequestSchema = z.object({
  items: z.array(moderateContentRequestSchema).max(50),
});

export const batchTranslationRequestSchema = z.object({
  items: z.array(translateContentRequestSchema).max(20),
  targetLanguages: z.array(z.string()).min(1).max(10),
});

// Response types
export interface AIServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  processingTime?: number;
}

export interface BatchProcessingResult<T> {
  successful: T[];
  failed: Array<{
    input: unknown;
    error: string;
  }>;
  totalProcessingTime: number;
}
