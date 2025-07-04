'use client';

import * as React from 'react';
import { Card } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { cn } from '~/lib/utils';

interface SkillMatchUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  location: string | null;
}

interface SkillMatch {
  userId: string;
  matchScore: number;
  commonSkills: string[];
  complementarySkills: string[];
  user: SkillMatchUser;
}

interface ProjectMatch {
  projectId: string;
  matchScore: number;
  matchingSkills: string[];
  missingSkills: string[];
  project: {
    id: string;
    title: string;
    description: string;
    creator: {
      firstName: string | null;
      lastName: string | null;
    };
  };
}

interface MatchCardProps {
  match: SkillMatch | ProjectMatch;
  type: 'user' | 'project';
  onContact?: () => void;
  onViewDetails?: () => void;
  className?: string;
}

function isSkillMatch(match: SkillMatch | ProjectMatch): match is SkillMatch {
  return 'userId' in match;
}

export function MatchCard({
  match,
  type,
  onContact,
  onViewDetails,
  className,
}: MatchCardProps) {
  const matchPercentage = Math.round(match.matchScore * 100);

  const getMatchColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 0.6) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (score >= 0.4) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-orange-600 bg-orange-50 border-orange-200';
  };

  if (type === 'user' && isSkillMatch(match)) {
    const user = match.user;
    const displayName =
      [user.firstName, user.lastName].filter(Boolean).join(' ') ||
      'Anonymous User';

    return (
      <Card className={cn('p-4 hover:shadow-md transition-shadow', className)}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {user.imageUrl ? (
              <img
                src={user.imageUrl}
                alt={displayName}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-[--color-primary] text-[--color-primary-foreground] flex items-center justify-center font-medium">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <h3 className="font-medium text-[--color-text-primary]">
                {displayName}
              </h3>
              {user.location && (
                <p className="text-sm text-[--color-text-secondary]">
                  {user.location}
                </p>
              )}
            </div>
          </div>
          <Badge className={cn('font-medium', getMatchColor(match.matchScore))}>
            {matchPercentage}% match
          </Badge>
        </div>

        {/* Common Skills */}
        {match.commonSkills.length > 0 && (
          <div className="mb-3">
            <h4 className="text-sm font-medium text-[--color-text-primary] mb-2">
              Shared Skills ({match.commonSkills.length})
            </h4>
            <div className="flex flex-wrap gap-1">
              {match.commonSkills.slice(0, 3).map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {match.commonSkills.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{match.commonSkills.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Complementary Skills */}
        {match.complementarySkills.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-[--color-text-primary] mb-2">
              Complementary Skills ({match.complementarySkills.length})
            </h4>
            <div className="flex flex-wrap gap-1">
              {match.complementarySkills.slice(0, 3).map((skill) => (
                <Badge key={skill} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {match.complementarySkills.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{match.complementarySkills.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {onContact && (
            <Button
              variant="default"
              size="sm"
              onClick={onContact}
              className="flex-1"
            >
              Contact
            </Button>
          )}
          {onViewDetails && (
            <Button variant="outline" size="sm" onClick={onViewDetails}>
              View Profile
            </Button>
          )}
        </div>
      </Card>
    );
  }

  if (type === 'project' && !isSkillMatch(match)) {
    const project = match.project;
    const creatorName =
      [project.creator.firstName, project.creator.lastName]
        .filter(Boolean)
        .join(' ') || 'Anonymous';

    return (
      <Card className={cn('p-4 hover:shadow-md transition-shadow', className)}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-medium text-[--color-text-primary] mb-1">
              {project.title}
            </h3>
            <p className="text-sm text-[--color-text-secondary] mb-1">
              by {creatorName}
            </p>
            <p className="text-sm text-[--color-text-tertiary] line-clamp-2">
              {project.description}
            </p>
          </div>
          <Badge
            className={cn('font-medium ml-3', getMatchColor(match.matchScore))}
          >
            {matchPercentage}% match
          </Badge>
        </div>

        {/* Matching Skills */}
        {match.matchingSkills.length > 0 && (
          <div className="mb-3">
            <h4 className="text-sm font-medium text-[--color-text-primary] mb-2">
              Your Matching Skills ({match.matchingSkills.length})
            </h4>
            <div className="flex flex-wrap gap-1">
              {match.matchingSkills.slice(0, 4).map((skill) => (
                <Badge key={skill} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
              {match.matchingSkills.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{match.matchingSkills.length - 4} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Missing Skills */}
        {match.missingSkills.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-[--color-text-primary] mb-2">
              Skills They Need ({match.missingSkills.length})
            </h4>
            <div className="flex flex-wrap gap-1">
              {match.missingSkills.slice(0, 4).map((skill) => (
                <Badge
                  key={skill}
                  variant="outline"
                  className="text-xs text-orange-600"
                >
                  {skill}
                </Badge>
              ))}
              {match.missingSkills.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{match.missingSkills.length - 4} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {onContact && (
            <Button
              variant="default"
              size="sm"
              onClick={onContact}
              className="flex-1"
            >
              Join Project
            </Button>
          )}
          {onViewDetails && (
            <Button variant="outline" size="sm" onClick={onViewDetails}>
              View Project
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return null;
}
