'use client';

import { formatDistanceToNow } from 'date-fns';

interface WonderCardProps {
  wonder: {
    id: string;
    question: string;
    category: string;
    responseCount: number;
    createdAt: Date;
    author?: {
      firstName: string | null;
      lastName: string | null;
      imageUrl: string | null;
    } | null;
    _count: {
      responses: number;
      patterns: number;
    };
  };
  showPattern?: boolean;
}

export function WonderCard({ wonder, showPattern = false }: WonderCardProps) {
  const categoryEmojis: Record<string, string> = {
    GENERAL: '🤔',
    BUSINESS: '💼',
    RECREATION: '🎯',
    INFRASTRUCTURE: '🏗️',
    COMMUNITY: '🏘️',
    ENVIRONMENT: '🌱',
  };

  const categoryEmoji = categoryEmojis[wonder.category] || '🤔';

  return (
    <div className="bg-[--color-surface] rounded-[--border-radius-lg] p-4 border border-[--color-border] hover:border-[--color-primary]/30 transition-colors cursor-pointer group">
      <div className="flex items-start justify-between">
        {/* Content */}
        <div className="flex-1 min-w-0 mr-3">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg">{categoryEmoji}</span>
            <span className="text-xs text-[--color-text-tertiary] uppercase tracking-wide font-medium">
              {wonder.category.toLowerCase()}
            </span>
            {showPattern && wonder._count.patterns > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700">
                <span className="mr-1">🔮</span>
                Pattern detected
              </span>
            )}
          </div>

          <h3 className="font-medium text-[--color-text-primary] mb-2 line-clamp-2 group-hover:text-[--color-primary] transition-colors">
            {wonder.question}
          </h3>

          <div className="flex items-center space-x-3 text-sm text-[--color-text-tertiary]">
            <span className="flex items-center space-x-1">
              <span>🔥</span>
              <span>{wonder._count.responses}</span>
            </span>
            <span>•</span>
            <span>{formatDistanceToNow(wonder.createdAt)} ago</span>
            {wonder.author && (
              <>
                <span>•</span>
                <span>by {wonder.author.firstName}</span>
              </>
            )}
          </div>
        </div>

        {/* Action */}
        <div className="flex-shrink-0">
          <button className="w-8 h-8 rounded-full bg-[--color-surface-hover] hover:bg-[--color-primary] hover:text-white transition-colors flex items-center justify-center">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
