/**
 * AI Service Fallback System
 * Provides graceful degradation when AI services are unavailable or rate-limited
 */

export enum FallbackStrategy {
  CACHE_ONLY = 'cache_only',
  SIMPLIFIED = 'simplified',
  MANUAL = 'manual',
  DISABLED = 'disabled',
}

export interface FallbackResponse<T> {
  data: T | null;
  fallbackUsed: boolean;
  fallbackStrategy: FallbackStrategy;
  message?: string;
  retryAfter?: number; // seconds
}

export interface AIServiceStatus {
  available: boolean;
  rateLimited: boolean;
  lastError?: string;
  nextRetryTime?: number;
  consecutiveFailures: number;
}

export class AIFallbackManager {
  private static instance: AIFallbackManager;
  private serviceStatus: Map<string, AIServiceStatus> = new Map();
  private cache: Map<
    string,
    { data: unknown; timestamp: number; ttl: number }
  > = new Map();

  // Circuit breaker thresholds
  private readonly MAX_CONSECUTIVE_FAILURES = 3;
  private readonly CIRCUIT_BREAKER_TIMEOUT = 300000; // 5 minutes
  private readonly CACHE_TTL = 3600000; // 1 hour

  private constructor() {
    // Initialize service status
    ['openai', 'google', 'azure', 'perplexity'].forEach((service) => {
      this.serviceStatus.set(service, {
        available: true,
        rateLimited: false,
        consecutiveFailures: 0,
      });
    });
  }

  static getInstance(): AIFallbackManager {
    if (!AIFallbackManager.instance) {
      AIFallbackManager.instance = new AIFallbackManager();
    }
    return AIFallbackManager.instance;
  }

  /**
   * Check if a service is available (not in circuit breaker state)
   */
  isServiceAvailable(serviceName: string): boolean {
    const status = this.serviceStatus.get(serviceName);
    if (!status) return false;

    // Check if circuit breaker should be reset
    if (
      !status.available &&
      status.nextRetryTime &&
      Date.now() > status.nextRetryTime
    ) {
      status.available = true;
      status.consecutiveFailures = 0;
      status.nextRetryTime = undefined;
    }

    return status.available && !status.rateLimited;
  }

  /**
   * Record a service failure
   */
  recordFailure(serviceName: string, error: string, isRateLimit = false): void {
    const status = this.serviceStatus.get(serviceName);
    if (!status) return;

    status.consecutiveFailures++;
    status.lastError = error;

    if (isRateLimit) {
      status.rateLimited = true;
      // Reset rate limit after 1 minute
      setTimeout(() => {
        status.rateLimited = false;
      }, 60000);
    }

    // Trigger circuit breaker
    if (status.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
      status.available = false;
      status.nextRetryTime = Date.now() + this.CIRCUIT_BREAKER_TIMEOUT;
    }
  }

  /**
   * Record a service success
   */
  recordSuccess(serviceName: string): void {
    const status = this.serviceStatus.get(serviceName);
    if (!status) return;

    status.consecutiveFailures = 0;
    status.available = true;
    status.rateLimited = false;
    status.lastError = undefined;
    status.nextRetryTime = undefined;
  }

  /**
   * Get cached response if available and not expired
   */
  getCachedResponse<T>(cacheKey: string): T | null {
    const cached = this.cache.get(cacheKey);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(cacheKey);
      return null;
    }

    return cached.data as T;
  }

  /**
   * Set cached response
   */
  setCachedResponse<T>(cacheKey: string, data: T, ttl = this.CACHE_TTL): void {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Get fallback content suggestion
   */
  getFallbackContentSuggestion(
    campaignTitle: string,
    description: string
  ): FallbackResponse<{ suggestion: string; confidence: number }> {
    // Check cache first
    const cacheKey = `suggestion:${campaignTitle}:${description}`;
    const cached = this.getCachedResponse<{
      suggestion: string;
      confidence: number;
    }>(cacheKey);

    if (cached) {
      return {
        data: cached,
        fallbackUsed: true,
        fallbackStrategy: FallbackStrategy.CACHE_ONLY,
        message: 'Using cached suggestion',
      };
    }

    // Provide simplified rule-based suggestion
    const wordCount = description.split(' ').length;
    let suggestion = '';

    if (wordCount < 50) {
      suggestion =
        'Consider adding more details about the project timeline, expected outcomes, and how community members can get involved.';
    } else if (wordCount > 200) {
      suggestion =
        'Consider making the description more concise while highlighting the key benefits and call-to-action.';
    } else if (!description.includes('community')) {
      suggestion =
        'Consider emphasizing the community benefits and how this project will bring people together.';
    } else {
      suggestion =
        'Your campaign looks good! Consider adding specific dates, budget information, or volunteer opportunities to increase engagement.';
    }

    const fallbackData = { suggestion, confidence: 0.6 };
    this.setCachedResponse(cacheKey, fallbackData, this.CACHE_TTL);

    return {
      data: fallbackData,
      fallbackUsed: true,
      fallbackStrategy: FallbackStrategy.SIMPLIFIED,
      message: 'AI service unavailable, using rule-based suggestions',
    };
  }

  /**
   * Get fallback moderation result
   */
  getFallbackModeration(content: string): FallbackResponse<{
    safetyScore: number;
    qualityScore: number;
    flaggedIssues: string[];
  }> {
    const cacheKey = `moderation:${content}`;
    const cached = this.getCachedResponse<{
      safetyScore: number;
      qualityScore: number;
      flaggedIssues: string[];
    }>(cacheKey);

    if (cached) {
      return {
        data: cached,
        fallbackUsed: true,
        fallbackStrategy: FallbackStrategy.CACHE_ONLY,
        message: 'Using cached moderation result',
      };
    }

    // Basic rule-based moderation
    const flaggedIssues: string[] = [];
    let safetyScore = 1.0;
    let qualityScore = 0.8;

    // Check for common problematic patterns
    const problematicPatterns = [
      /URGENT!!!/gi,
      /send money/gi,
      /click here now/gi,
      /limited time/gi,
      /(free|easy) money/gi,
    ];

    problematicPatterns.forEach((pattern) => {
      if (pattern.test(content)) {
        flaggedIssues.push('potentially_misleading');
        safetyScore -= 0.3;
      }
    });

    // Check content quality
    if (content.length < 50) {
      qualityScore -= 0.3;
      flaggedIssues.push('too_short');
    }

    if (content.toUpperCase() === content && content.length > 20) {
      qualityScore -= 0.2;
      flaggedIssues.push('excessive_caps');
    }

    const fallbackData = {
      safetyScore: Math.max(0, safetyScore),
      qualityScore: Math.max(0, qualityScore),
      flaggedIssues: [...new Set(flaggedIssues)], // Remove duplicates
    };

    this.setCachedResponse(cacheKey, fallbackData, this.CACHE_TTL);

    return {
      data: fallbackData,
      fallbackUsed: true,
      fallbackStrategy: FallbackStrategy.SIMPLIFIED,
      message: 'AI moderation unavailable, using basic pattern matching',
    };
  }

  /**
   * Get fallback sentiment analysis
   */
  getFallbackSentimentAnalysis(content: string): FallbackResponse<{
    sentiment: number;
    emotions: Record<string, number>;
    keywords: string[];
  }> {
    const cacheKey = `sentiment:${content}`;
    const cached = this.getCachedResponse<{
      sentiment: number;
      emotions: Record<string, number>;
      keywords: string[];
    }>(cacheKey);

    if (cached) {
      return {
        data: cached,
        fallbackUsed: true,
        fallbackStrategy: FallbackStrategy.CACHE_ONLY,
        message: 'Using cached sentiment analysis',
      };
    }

    // Simple rule-based sentiment analysis
    const positiveWords = [
      'good',
      'great',
      'excellent',
      'amazing',
      'wonderful',
      'love',
      'support',
      'help',
      'beautiful',
      'excited',
    ];
    const negativeWords = [
      'bad',
      'terrible',
      'awful',
      'hate',
      'against',
      'wrong',
      'problem',
      'issue',
      'concern',
      'worried',
    ];

    const words = content.toLowerCase().split(/\W+/);
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach((word) => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });

    const sentiment =
      (positiveCount - negativeCount) / Math.max(words.length, 1);

    // Extract basic keywords (words longer than 4 characters, excluding common words)
    const commonWords = [
      'this',
      'that',
      'with',
      'have',
      'will',
      'from',
      'they',
      'know',
      'want',
      'been',
      'good',
      'much',
      'some',
      'time',
      'very',
      'when',
      'come',
      'here',
      'just',
      'like',
      'long',
      'make',
      'many',
      'over',
      'such',
      'take',
      'than',
      'them',
      'well',
      'were',
    ];
    const keywords = words
      .filter((word) => word.length > 4 && !commonWords.includes(word))
      .slice(0, 5);

    const fallbackData = {
      sentiment: Math.max(-1, Math.min(1, sentiment)),
      emotions: {
        joy:
          positiveCount > 0
            ? Math.min(1, (positiveCount / words.length) * 5)
            : 0,
        sadness:
          negativeCount > 0
            ? Math.min(1, (negativeCount / words.length) * 5)
            : 0,
      },
      keywords,
    };

    this.setCachedResponse(cacheKey, fallbackData, this.CACHE_TTL);

    return {
      data: fallbackData,
      fallbackUsed: true,
      fallbackStrategy: FallbackStrategy.SIMPLIFIED,
      message:
        'AI sentiment analysis unavailable, using keyword-based analysis',
    };
  }

  /**
   * Get fallback translation (returns message about unavailability)
   */
  getFallbackTranslation(
    text: string,
    targetLanguage: string
  ): FallbackResponse<{
    translatedText: string;
    sourceLanguage: string;
    targetLanguage: string;
  }> {
    return {
      data: null,
      fallbackUsed: true,
      fallbackStrategy: FallbackStrategy.MANUAL,
      message: `Translation to ${targetLanguage} is temporarily unavailable. Please try again later or use an external translation service.`,
      retryAfter: 300, // 5 minutes
    };
  }

  /**
   * Get fallback accessibility analysis
   */
  getFallbackAccessibilityScore(content: {
    text: string;
    hasImages: boolean;
  }): FallbackResponse<{
    score: number;
    suggestions: string[];
  }> {
    const cacheKey = `accessibility:${content.text}:${content.hasImages}`;
    const cached = this.getCachedResponse<{
      score: number;
      suggestions: string[];
    }>(cacheKey);

    if (cached) {
      return {
        data: cached,
        fallbackUsed: true,
        fallbackStrategy: FallbackStrategy.CACHE_ONLY,
        message: 'Using cached accessibility analysis',
      };
    }

    // Basic accessibility scoring
    let score = 70; // Base score
    const suggestions: string[] = [];

    // Check reading level (simple heuristic)
    const sentences = content.text
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 0);
    const avgWordsPerSentence =
      content.text.split(/\s+/).length / sentences.length;

    if (avgWordsPerSentence > 20) {
      score -= 15;
      suggestions.push(
        'Consider using shorter sentences for better readability'
      );
    }

    // Check for images without considering alt text in fallback
    if (content.hasImages) {
      score -= 10;
      suggestions.push('Ensure all images have descriptive alt text');
    }

    // Check text length
    if (content.text.length < 100) {
      score += 10;
      suggestions.push('Good job keeping the content concise');
    }

    const fallbackData = {
      score: Math.max(0, Math.min(100, score)),
      suggestions,
    };

    this.setCachedResponse(cacheKey, fallbackData, this.CACHE_TTL);

    return {
      data: fallbackData,
      fallbackUsed: true,
      fallbackStrategy: FallbackStrategy.SIMPLIFIED,
      message: 'AI accessibility analysis unavailable, using basic heuristics',
    };
  }

  /**
   * Get service status for monitoring
   */
  getServiceStatus(): Record<string, AIServiceStatus> {
    const status: Record<string, AIServiceStatus> = {};
    this.serviceStatus.forEach((value, key) => {
      status[key] = { ...value };
    });
    return status;
  }

  /**
   * Clear all cached responses
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    // This is a simplified implementation
    // In a real system, you'd track hit/miss rates
    return {
      size: this.cache.size,
      hitRate: 0.75, // Mock data
    };
  }
}

// Export singleton instance
export const aiFallbackManager = AIFallbackManager.getInstance();
