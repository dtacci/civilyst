import { TRPCError } from '@trpc/server';
// import { aiFallbackManager, FallbackResponse } from './fallback';

// AI Service Types
export enum AIServiceType {
  OPENAI = 'openai',
  GOOGLE_VISION = 'google_vision',
  AZURE_COGNITIVE = 'azure_cognitive',
  GOOGLE_TRANSLATE = 'google_translate',
}

// Service Configuration
interface ServiceConfig {
  apiKey?: string;
  endpoint?: string;
  maxRetries: number;
  timeout: number;
  rateLimitPerMinute: number;
}

// Rate Limiter
class RateLimiter {
  private requests: number[] = [];

  constructor(private limit: number) {}

  canMakeRequest(): boolean {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    // Remove old requests
    this.requests = this.requests.filter((time) => time > oneMinuteAgo);

    return this.requests.length < this.limit;
  }

  recordRequest(): void {
    this.requests.push(Date.now());
  }
}

// Base AI Service Client
export class AIServiceClient {
  private static instance: AIServiceClient;
  private rateLimiters: Map<AIServiceType, RateLimiter> = new Map();
  private configs: Map<AIServiceType, ServiceConfig> = new Map();

  private constructor() {
    this.initializeServices();
  }

  static getInstance(): AIServiceClient {
    if (!AIServiceClient.instance) {
      AIServiceClient.instance = new AIServiceClient();
    }
    return AIServiceClient.instance;
  }

  private initializeServices(): void {
    // OpenAI Configuration
    this.configs.set(AIServiceType.OPENAI, {
      apiKey: process.env.OPENAI_API_KEY,
      maxRetries: 3,
      timeout: 30000,
      rateLimitPerMinute: 60,
    });

    // Google Cloud Vision Configuration
    this.configs.set(AIServiceType.GOOGLE_VISION, {
      apiKey: process.env.GOOGLE_CLOUD_VISION_API_KEY,
      maxRetries: 3,
      timeout: 30000,
      rateLimitPerMinute: 100,
    });

    // Azure Cognitive Services Configuration
    this.configs.set(AIServiceType.AZURE_COGNITIVE, {
      apiKey: process.env.AZURE_COGNITIVE_SERVICES_KEY,
      endpoint: process.env.AZURE_COGNITIVE_SERVICES_ENDPOINT,
      maxRetries: 3,
      timeout: 30000,
      rateLimitPerMinute: 100,
    });

    // Google Translate Configuration
    this.configs.set(AIServiceType.GOOGLE_TRANSLATE, {
      apiKey: process.env.GOOGLE_TRANSLATE_API_KEY,
      maxRetries: 3,
      timeout: 30000,
      rateLimitPerMinute: 100,
    });

    // Initialize rate limiters
    for (const [service, config] of this.configs.entries()) {
      this.rateLimiters.set(
        service,
        new RateLimiter(config.rateLimitPerMinute)
      );
    }
  }

  private async makeRequest<T>(
    service: AIServiceType,
    requestFn: () => Promise<T>
  ): Promise<T> {
    const config = this.configs.get(service);
    if (!config) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `Service ${service} not configured`,
      });
    }

    // Check API key
    if (!config.apiKey && service !== AIServiceType.AZURE_COGNITIVE) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: `API key not configured for ${service}`,
      });
    }

    // Check rate limit
    const rateLimiter = this.rateLimiters.get(service)!;
    if (!rateLimiter.canMakeRequest()) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: `Rate limit exceeded for ${service}`,
      });
    }

    // Make request with retries
    let lastError: Error | undefined;
    for (let attempt = 0; attempt < config.maxRetries; attempt++) {
      try {
        rateLimiter.recordRequest();

        // Add timeout wrapper
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(
            () => reject(new Error('Request timeout')),
            config.timeout
          );
        });

        const result = await Promise.race([requestFn(), timeoutPromise]);
        return result as T;
      } catch (error) {
        lastError = error as Error;
        console.error(
          `${service} request failed (attempt ${attempt + 1}):`,
          error
        );

        // Don't retry on certain errors
        if (error instanceof TRPCError && error.code === 'BAD_REQUEST') {
          throw error;
        }

        // Exponential backoff
        if (attempt < config.maxRetries - 1) {
          await new Promise((resolve) =>
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          );
        }
      }
    }

    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: `${service} request failed after ${config.maxRetries} attempts`,
      cause: lastError,
    });
  }

  // Content Moderation using OpenAI
  async moderateContent(content: string): Promise<{
    safetyScore: number;
    qualityScore: number;
    flaggedIssues: string[];
  }> {
    return this.makeRequest(AIServiceType.OPENAI, async () => {
      const response = await fetch('https://api.openai.com/v1/moderations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.configs.get(AIServiceType.OPENAI)!.apiKey}`,
        },
        body: JSON.stringify({ input: content }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const result = data.results[0];

      // Calculate safety score (inverse of flagged categories)
      const flaggedCategories = Object.entries(result.categories)
        .filter(([_, flagged]) => flagged)
        .map(([category]) => category);

      const safetyScore =
        1 - flaggedCategories.length / Object.keys(result.categories).length;

      // For now, quality score is based on content length and structure
      const qualityScore = Math.min(1, content.length / 500);

      return {
        safetyScore,
        qualityScore,
        flaggedIssues: flaggedCategories,
      };
    });
  }

  // Content Suggestion using OpenAI
  async generateContentSuggestion(
    campaignData: {
      title: string;
      description: string;
      location?: string;
    },
    suggestionType: 'location-based' | 'interest-based' | 'trending'
  ): Promise<{
    suggestion: string;
    confidence: number;
  }> {
    return this.makeRequest(AIServiceType.OPENAI, async () => {
      const prompt = this.buildSuggestionPrompt(campaignData, suggestionType);

      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.configs.get(AIServiceType.OPENAI)!.apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content:
                  'You are a helpful assistant that provides suggestions to improve civic engagement campaigns.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.7,
            max_tokens: 200,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const suggestion = data.choices[0].message.content.trim();

      // Simple confidence calculation based on model's response
      const confidence = data.choices[0].finish_reason === 'stop' ? 0.8 : 0.6;

      return { suggestion, confidence };
    });
  }

  // Campaign Summarization using OpenAI
  async generateCampaignSummary(campaignData: {
    title: string;
    description: string;
    comments?: string[];
    voteCount?: { support: number; oppose: number };
  }): Promise<{
    shortSummary: string;
    fullSummary: string;
    keyPoints: string[];
  }> {
    return this.makeRequest(AIServiceType.OPENAI, async () => {
      const prompt = this.buildSummaryPrompt(campaignData);

      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.configs.get(AIServiceType.OPENAI)!.apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content:
                  'You are a helpful assistant that creates clear, concise summaries of civic campaigns.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            temperature: 0.5,
            max_tokens: 500,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;

      // Parse the structured response
      const lines = content.split('\n').filter((line) => line.trim());
      const shortSummary =
        lines
          .find((line) => line.startsWith('SHORT:'))
          ?.replace('SHORT:', '')
          .trim() || '';
      const fullSummary =
        lines
          .find((line) => line.startsWith('FULL:'))
          ?.replace('FULL:', '')
          .trim() || '';
      const keyPointsStart = lines.findIndex((line) =>
        line.startsWith('KEY POINTS:')
      );
      const keyPoints =
        keyPointsStart >= 0
          ? lines
              .slice(keyPointsStart + 1)
              .map((point) => point.replace(/^[-*]\s*/, '').trim())
          : [];

      return { shortSummary, fullSummary, keyPoints };
    });
  }

  // Translation using Google Translate
  async translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage: string = 'auto'
  ): Promise<string> {
    return this.makeRequest(AIServiceType.GOOGLE_TRANSLATE, async () => {
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2?key=${this.configs.get(AIServiceType.GOOGLE_TRANSLATE)!.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: text,
            target: targetLanguage,
            source: sourceLanguage === 'auto' ? undefined : sourceLanguage,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Google Translate API error: ${response.status}`);
      }

      const data = await response.json();
      return data.data.translations[0].translatedText;
    });
  }

  // Image Analysis using Google Cloud Vision
  async analyzeImage(imageUrl: string): Promise<{
    altText: string;
    hasInappropriateContent: boolean;
    labels: string[];
  }> {
    return this.makeRequest(AIServiceType.GOOGLE_VISION, async () => {
      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${this.configs.get(AIServiceType.GOOGLE_VISION)!.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [
              {
                image: {
                  source: {
                    imageUri: imageUrl,
                  },
                },
                features: [
                  { type: 'LABEL_DETECTION', maxResults: 10 },
                  { type: 'SAFE_SEARCH_DETECTION' },
                  { type: 'TEXT_DETECTION' },
                ],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Google Cloud Vision API error: ${response.status}`);
      }

      const data = await response.json();
      const result = data.responses[0];

      // Extract labels for alt text
      const labels =
        result.labelAnnotations?.map(
          (label: { description: string }) => label.description
        ) || [];
      const altText = labels.slice(0, 3).join(', ');

      // Check safe search
      const safeSearch = result.safeSearchAnnotation || {};
      const hasInappropriateContent = Object.values(safeSearch).some(
        (level) => level === 'LIKELY' || level === 'VERY_LIKELY'
      );

      return { altText, hasInappropriateContent, labels };
    });
  }

  // Sentiment Analysis using Azure Cognitive Services
  async analyzeSentiment(text: string): Promise<{
    sentiment: number;
    emotions: Record<string, number>;
    keywords: string[];
  }> {
    const config = this.configs.get(AIServiceType.AZURE_COGNITIVE)!;

    if (!config.endpoint || !config.apiKey) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Azure Cognitive Services not configured',
      });
    }

    return this.makeRequest(AIServiceType.AZURE_COGNITIVE, async () => {
      const response = await fetch(
        `${config.endpoint}/text/analytics/v3.1/sentiment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Ocp-Apim-Subscription-Key': config.apiKey!,
          },
          body: JSON.stringify({
            documents: [
              {
                id: '1',
                text: text,
                language: 'en',
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Azure Cognitive Services API error: ${response.status}`
        );
      }

      const data = await response.json();
      const result = data.documents[0];

      // Convert sentiment to -1 to 1 scale
      const sentimentScores = result.confidenceScores;
      const sentiment = sentimentScores.positive - sentimentScores.negative;

      // Extract emotions (simplified - Azure doesn't provide emotion detection in basic sentiment API)
      const emotions = {
        positive: sentimentScores.positive,
        neutral: sentimentScores.neutral,
        negative: sentimentScores.negative,
      };

      // Extract keywords using simple regex (in production, use key phrase extraction API)
      const keywords = text
        .split(/\s+/)
        .filter((word) => word.length > 4)
        .slice(0, 5);

      return { sentiment, emotions, keywords };
    });
  }

  // Language Detection using Google Translate API
  async detectLanguage(text: string): Promise<{
    language: string;
    confidence: number;
  }> {
    return this.makeRequest(AIServiceType.GOOGLE, async () => {
      const response = await fetch(
        `https://translation.googleapis.com/language/translate/v2/detect?key=${this.configs.get(AIServiceType.GOOGLE)!.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            q: text,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Language detection failed: ${response.statusText}`);
      }

      const result = await response.json();
      const detection = result.data.detections[0][0];

      return {
        language: detection.language,
        confidence: detection.confidence,
      };
    });
  }

  // Calculate Accessibility Score
  async calculateAccessibilityScore(content: {
    text: string;
    hasImages: boolean;
    imageCount: number;
  }): Promise<{
    score: number;
    suggestions: string[];
  }> {
    return this.makeRequest(AIServiceType.OPENAI, async () => {
      const prompt = `Analyze the accessibility of this content and provide a score from 0-100 and suggestions:

Content: ${content.text}
Has Images: ${content.hasImages}
Image Count: ${content.imageCount}

Consider:
- Reading level and clarity
- Length and structure
- Use of inclusive language
- Image accessibility (alt text needs)
- Color contrast considerations
- Screen reader compatibility

Provide response in this format:
SCORE: [0-100]
SUGGESTIONS:
- Suggestion 1
- Suggestion 2
- Suggestion 3`;

      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.configs.get(AIServiceType.OPENAI)!.apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content:
                  'You are an accessibility expert that evaluates content for inclusivity and accessibility compliance.',
              },
              {
                role: 'user',
                content: prompt,
              },
            ],
            max_tokens: 500,
            temperature: 0.3,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Accessibility analysis failed: ${response.statusText}`
        );
      }

      const result = await response.json();
      const analysis = result.choices[0].message.content;

      // Parse the response
      const scoreMatch = analysis.match(/SCORE:\s*(\d+)/);
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 50;

      const suggestionsMatch = analysis.match(/SUGGESTIONS:\s*([\s\S]*)/);
      const suggestions = suggestionsMatch
        ? suggestionsMatch[1]
            .split('\n')
            .filter((line: string) => line.trim().startsWith('-'))
            .map((line: string) => line.replace(/^-\s*/, '').trim())
            .filter((suggestion: string) => suggestion.length > 0)
        : [];

      return { score, suggestions };
    });
  }

  // Generate Audio Description for Media
  async generateAudioDescription(
    mediaUrl: string,
    mediaType: 'image' | 'video'
  ): Promise<string> {
    return this.makeRequest(AIServiceType.GOOGLE, async () => {
      if (mediaType === 'image') {
        // Use Google Cloud Vision API for image analysis
        const response = await fetch(
          `https://vision.googleapis.com/v1/images:annotate?key=${this.configs.get(AIServiceType.GOOGLE)!.apiKey}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              requests: [
                {
                  image: {
                    source: {
                      imageUri: mediaUrl,
                    },
                  },
                  features: [
                    { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
                    { type: 'TEXT_DETECTION', maxResults: 1 },
                    { type: 'LABEL_DETECTION', maxResults: 10 },
                  ],
                },
              ],
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`Image analysis failed: ${response.statusText}`);
        }

        const result = await response.json();
        const annotation = result.responses[0];

        // Build description from detected elements
        const objects =
          annotation.localizedObjectAnnotations?.map(
            (obj: { name: string }) => obj.name
          ) || [];
        const labels =
          annotation.labelAnnotations?.map(
            (label: { description: string }) => label.description
          ) || [];
        const text = annotation.textAnnotations?.[0]?.description || '';

        let description = `This image contains: ${[...new Set([...objects, ...labels])].slice(0, 5).join(', ')}.`;

        if (text) {
          description += ` Text in image: "${text.replace(/\n/g, ' ').slice(0, 100)}".`;
        }

        return description;
      } else {
        // For video, return a placeholder implementation
        return `This video content requires manual audio description. Please provide a detailed description of visual elements, actions, and text that appear in the video.`;
      }
    });
  }

  // Helper methods
  private buildSuggestionPrompt(
    campaignData: { title: string; description: string; location?: string },
    suggestionType: string
  ): string {
    const basePrompt = `Campaign Title: ${campaignData.title}\nDescription: ${campaignData.description}`;

    switch (suggestionType) {
      case 'location-based':
        return `${basePrompt}\nLocation: ${campaignData.location || 'Not specified'}\n\nProvide a location-specific suggestion to improve this campaign's local relevance and engagement.`;
      case 'interest-based':
        return `${basePrompt}\n\nProvide a suggestion to make this campaign more appealing to specific interest groups or demographics.`;
      case 'trending':
        return `${basePrompt}\n\nProvide a suggestion to incorporate current trends or popular topics that could increase campaign visibility.`;
      default:
        return `${basePrompt}\n\nProvide a general suggestion to improve this campaign.`;
    }
  }

  private buildSummaryPrompt(campaignData: {
    title: string;
    description: string;
    comments?: string[];
    voteCount?: { support: number; oppose: number };
  }): string {
    let prompt = `Campaign Title: ${campaignData.title}\nDescription: ${campaignData.description}`;

    if (campaignData.voteCount) {
      prompt += `\n\nVotes: ${campaignData.voteCount.support} support, ${campaignData.voteCount.oppose} oppose`;
    }

    if (campaignData.comments && campaignData.comments.length > 0) {
      prompt += `\n\nRecent Comments:\n${campaignData.comments.slice(0, 5).join('\n')}`;
    }

    prompt += `\n\nPlease provide:
SHORT: A 1-2 sentence summary
FULL: A paragraph summary
KEY POINTS:
- Point 1
- Point 2
- Point 3`;

    return prompt;
  }
}

// Export singleton instance
export const aiClient = AIServiceClient.getInstance();
