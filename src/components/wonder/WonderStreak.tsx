'use client';

interface WonderStreakProps {
  streak: number;
  totalResponses: number;
  canAskWonders: boolean;
  canSeePatterns: boolean;
}

export function WonderStreak({ streak, totalResponses, canAskWonders, canSeePatterns }: WonderStreakProps) {
  return (
    <div className="bg-gradient-to-r from-[--color-primary]/10 to-[--color-secondary]/10 rounded-[--border-radius-lg] p-4 border border-[--color-primary]/20">
      <div className="flex items-center justify-between">
        {/* Streak */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-[--color-primary] rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">{streak}</span>
          </div>
          <div>
            <p className="font-semibold text-[--color-text-primary]">
              {streak} day streak
            </p>
            <p className="text-[--color-text-secondary] text-sm">
              {totalResponses} total voices shared
            </p>
          </div>
        </div>

        {/* Unlocks */}
        <div className="flex items-center space-x-2">
          {/* Ask Wonders Unlock */}
          <div className={`
            flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium
            ${canAskWonders 
              ? 'bg-green-100 text-green-700' 
              : 'bg-gray-100 text-gray-500'
            }
          `}>
            <span>✨</span>
            <span>{canAskWonders ? 'Can ask' : '3 days to unlock'}</span>
          </div>

          {/* See Patterns Unlock */}
          <div className={`
            flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium
            ${canSeePatterns 
              ? 'bg-purple-100 text-purple-700' 
              : 'bg-gray-100 text-gray-500'
            }
          `}>
            <span>🔮</span>
            <span>{canSeePatterns ? 'Patterns' : '7 days'}</span>
          </div>
        </div>
      </div>

      {/* Progress to next unlock */}
      {(!canAskWonders || !canSeePatterns) && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-[--color-text-secondary] mb-2">
            <span>Next unlock:</span>
            <span>
              {!canAskWonders 
                ? `${3 - streak} more days to ask wonders`
                : `${7 - streak} more days for pattern insights`
              }
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-[--color-primary] h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${Math.min(100, (streak / (!canAskWonders ? 3 : 7)) * 100)}%` 
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
} 