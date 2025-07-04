'use client';

import * as React from 'react';
import { Badge } from '~/components/ui/badge';
import { cn } from '~/lib/utils';

interface SkillBadgeProps {
  skill: {
    id: string;
    name: string;
    category: string;
  };
  proficiencyLevel: number;
  isVerified?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

const proficiencyColors = {
  1: 'bg-red-100 text-red-800 border-red-200',
  2: 'bg-orange-100 text-orange-800 border-orange-200',
  3: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  4: 'bg-blue-100 text-blue-800 border-blue-200',
  5: 'bg-green-100 text-green-800 border-green-200',
};

const proficiencyLabels = {
  1: 'Beginner',
  2: 'Novice',
  3: 'Intermediate',
  4: 'Advanced',
  5: 'Expert',
};

const proficiencyIcons = {
  1: '●',
  2: '●●',
  3: '●●●',
  4: '●●●●',
  5: '●●●●●',
};

export function SkillBadge({
  skill,
  proficiencyLevel,
  isVerified = false,
  variant = 'default',
  className,
}: SkillBadgeProps) {
  const colorClass =
    proficiencyColors[proficiencyLevel as keyof typeof proficiencyColors];

  if (variant === 'compact') {
    return (
      <Badge
        className={cn(
          'inline-flex items-center gap-1 text-xs',
          colorClass,
          className
        )}
      >
        <span>{skill.name}</span>
        {isVerified && (
          <span className="text-green-600" title="Verified">
            ✓
          </span>
        )}
      </Badge>
    );
  }

  if (variant === 'detailed') {
    return (
      <div
        className={cn(
          'inline-flex flex-col items-start p-3 rounded-[--border-radius-md] border',
          colorClass,
          className
        )}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium">{skill.name}</span>
          {isVerified && (
            <span className="text-green-600" title="Verified skill">
              ✓
            </span>
          )}
        </div>
        <div className="text-xs opacity-75 mb-1">{skill.category}</div>
        <div className="flex items-center gap-2 text-xs">
          <span>
            {
              proficiencyLabels[
                proficiencyLevel as keyof typeof proficiencyLabels
              ]
            }
          </span>
          <span className="font-mono">
            {
              proficiencyIcons[
                proficiencyLevel as keyof typeof proficiencyIcons
              ]
            }
          </span>
        </div>
      </div>
    );
  }

  return (
    <Badge
      className={cn(
        'inline-flex items-center gap-2 px-3 py-1',
        colorClass,
        className
      )}
    >
      <span>{skill.name}</span>
      <span className="text-xs font-mono">
        {proficiencyIcons[proficiencyLevel as keyof typeof proficiencyIcons]}
      </span>
      {isVerified && (
        <span className="text-green-600" title="Verified skill">
          ✓
        </span>
      )}
    </Badge>
  );
}
