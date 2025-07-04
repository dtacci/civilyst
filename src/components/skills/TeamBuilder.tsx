'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import { Card } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Input } from '~/components/ui/input';
import { SkillBadge } from './SkillBadge';
import { MatchCard } from './MatchCard';
import { cn } from '~/lib/utils';
import { api } from '~/lib/trpc';

interface TeamMember {
  id: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  location: string | null;
  skills: Array<{
    id: string;
    skill: {
      id: string;
      name: string;
      category: string;
    };
    proficiencyLevel: number;
    isVerified: boolean;
  }>;
  role?: string;
}

interface SkillRequirement {
  skillId: string;
  skillName: string;
  category: string;
  minProficiency: number;
  isRequired: boolean;
  assignedMembers: string[];
}

interface TeamBuilderProps {
  projectId?: string;
  initialTeamMembers?: TeamMember[];
  skillRequirements?: SkillRequirement[];
  onTeamChange?: (team: TeamMember[]) => void;
  onSkillRequirementsChange?: (requirements: SkillRequirement[]) => void;
  maxTeamSize?: number;
  className?: string;
}

export function TeamBuilder({
  projectId,
  initialTeamMembers = [],
  skillRequirements = [],
  onTeamChange,
  onSkillRequirementsChange,
  maxTeamSize = 10,
  className,
}: TeamBuilderProps) {
  const [teamMembers, setTeamMembers] =
    useState<TeamMember[]>(initialTeamMembers);
  const [requirements, setRequirements] =
    useState<SkillRequirement[]>(skillRequirements);
  const [activeTab, setActiveTab] = useState<
    'team' | 'requirements' | 'suggestions'
  >('team');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch skill matches for team building
  const { data: skillMatches, isLoading: isLoadingMatches } =
    api.skillMatching.findMatches.useQuery(
      {
        limit: 20,
        minProficiency: 3,
      },
      {
        enabled: activeTab === 'suggestions',
      }
    );

  // Fetch project recommendations if projectId is provided
  const { data: projectRecommendations } =
    api.skillMatching.recommendUsers.useQuery(
      {
        projectId: projectId!,
        limit: 15,
        minProficiency: 3,
      },
      {
        enabled: !!projectId && activeTab === 'suggestions',
      }
    );

  const handleAddTeamMember = useCallback(
    (member: TeamMember) => {
      if (teamMembers.length >= maxTeamSize) return;
      if (teamMembers.some((m) => m.id === member.id)) return;

      const newTeam = [...teamMembers, member];
      setTeamMembers(newTeam);
      onTeamChange?.(newTeam);
    },
    [teamMembers, maxTeamSize, onTeamChange]
  );

  const handleRemoveTeamMember = useCallback(
    (memberId: string) => {
      const newTeam = teamMembers.filter((m) => m.id !== memberId);
      setTeamMembers(newTeam);
      onTeamChange?.(newTeam);

      // Remove member from skill assignments
      const updatedRequirements = requirements.map((req) => ({
        ...req,
        assignedMembers: req.assignedMembers.filter((id) => id !== memberId),
      }));
      setRequirements(updatedRequirements);
      onSkillRequirementsChange?.(updatedRequirements);
    },
    [teamMembers, requirements, onTeamChange, onSkillRequirementsChange]
  );

  const handleAssignSkill = useCallback(
    (requirementIndex: number, memberId: string) => {
      const updatedRequirements = [...requirements];
      const requirement = updatedRequirements[requirementIndex];

      if (!requirement.assignedMembers.includes(memberId)) {
        requirement.assignedMembers.push(memberId);
        setRequirements(updatedRequirements);
        onSkillRequirementsChange?.(updatedRequirements);
      }
    },
    [requirements, onSkillRequirementsChange]
  );

  const handleUnassignSkill = useCallback(
    (requirementIndex: number, memberId: string) => {
      const updatedRequirements = [...requirements];
      const requirement = updatedRequirements[requirementIndex];

      requirement.assignedMembers = requirement.assignedMembers.filter(
        (id) => id !== memberId
      );
      setRequirements(updatedRequirements);
      onSkillRequirementsChange?.(updatedRequirements);
    },
    [requirements, onSkillRequirementsChange]
  );

  const getTeamSkillCoverage = useCallback(() => {
    const coverage: Record<
      string,
      {
        requirement: SkillRequirement;
        coverage: number;
        assignedMemberCount: number;
      }
    > = {};

    requirements.forEach((req) => {
      coverage[req.skillId] = {
        requirement: req,
        coverage: req.assignedMembers.length > 0 ? 1 : 0,
        assignedMemberCount: req.assignedMembers.length,
      };
    });

    return coverage;
  }, [requirements]);

  const getSkillGaps = useCallback(() => {
    const coverage = getTeamSkillCoverage();
    return requirements.filter(
      (req) =>
        req.isRequired && coverage[req.skillId]?.assignedMemberCount === 0
    );
  }, [requirements, getTeamSkillCoverage]);

  const getMemberSkillMatch = useCallback(
    (member: TeamMember, skillId: string) => {
      return member.skills.find((s) => s.skill.id === skillId);
    },
    []
  );

  const filteredSuggestions = React.useMemo(() => {
    const suggestions = projectRecommendations || skillMatches || [];
    const teamMemberIds = new Set(teamMembers.map((m) => m.id));

    return suggestions.filter((suggestion) => {
      if ('userId' in suggestion) {
        // This is a skill match
        return !teamMemberIds.has(suggestion.userId);
      } else {
        // This would be a different type of suggestion
        return true;
      }
    });
  }, [skillMatches, projectRecommendations, teamMembers]);

  const skillGaps = getSkillGaps();
  const skillCoverage = getTeamSkillCoverage();

  return (
    <div className={cn('w-full', className)}>
      {/* Tab Navigation */}
      <div className="flex border-b border-[--color-border] mb-6">
        <button
          onClick={() => setActiveTab('team')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'team'
              ? 'border-[--color-primary] text-[--color-primary]'
              : 'border-transparent text-[--color-text-secondary] hover:text-[--color-text-primary]'
          )}
        >
          Team ({teamMembers.length}/{maxTeamSize})
        </button>
        <button
          onClick={() => setActiveTab('requirements')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'requirements'
              ? 'border-[--color-primary] text-[--color-primary]'
              : 'border-transparent text-[--color-text-secondary] hover:text-[--color-text-primary]'
          )}
        >
          Skill Requirements ({requirements.length})
        </button>
        <button
          onClick={() => setActiveTab('suggestions')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'suggestions'
              ? 'border-[--color-primary] text-[--color-primary]'
              : 'border-transparent text-[--color-text-secondary] hover:text-[--color-text-primary]'
          )}
        >
          Suggestions{' '}
          {skillGaps.length > 0 && (
            <Badge variant="destructive" className="ml-1 text-xs">
              {skillGaps.length} gaps
            </Badge>
          )}
        </button>
      </div>

      {/* Team Tab */}
      {activeTab === 'team' && (
        <div className="space-y-4">
          {/* Team Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-4">
              <div className="text-sm text-[--color-text-secondary]">
                Team Size
              </div>
              <div className="text-2xl font-bold">
                {teamMembers.length}/{maxTeamSize}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-[--color-text-secondary]">
                Skill Coverage
              </div>
              <div className="text-2xl font-bold">
                {Math.round(
                  (Object.values(skillCoverage).filter((c) => c.coverage > 0)
                    .length /
                    requirements.length) *
                    100
                ) || 0}
                %
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-[--color-text-secondary]">
                Critical Gaps
              </div>
              <div className="text-2xl font-bold text-red-600">
                {skillGaps.length}
              </div>
            </Card>
          </div>

          {/* Team Members */}
          <div className="space-y-3">
            {teamMembers.length === 0 ? (
              <div className="text-center py-8 text-[--color-text-secondary]">
                No team members yet. Add members from the suggestions tab.
              </div>
            ) : (
              teamMembers.map((member) => {
                const displayName =
                  [member.firstName, member.lastName]
                    .filter(Boolean)
                    .join(' ') || 'Anonymous User';

                return (
                  <Card key={member.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {member.imageUrl ? (
                          <img
                            src={member.imageUrl}
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
                          {member.location && (
                            <p className="text-sm text-[--color-text-secondary]">
                              {member.location}
                            </p>
                          )}
                          {member.role && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {member.role}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveTeamMember(member.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Remove
                      </Button>
                    </div>

                    {/* Member Skills */}
                    <div className="mt-3">
                      <div className="text-sm font-medium text-[--color-text-primary] mb-2">
                        Skills ({member.skills.length})
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {member.skills.slice(0, 6).map((userSkill) => (
                          <SkillBadge
                            key={userSkill.id}
                            skill={userSkill.skill}
                            proficiencyLevel={userSkill.proficiencyLevel}
                            isVerified={userSkill.isVerified}
                            variant="compact"
                          />
                        ))}
                        {member.skills.length > 6 && (
                          <Badge variant="outline" className="text-xs">
                            +{member.skills.length - 6} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Requirements Tab */}
      {activeTab === 'requirements' && (
        <div className="space-y-4">
          {requirements.length === 0 ? (
            <div className="text-center py-8 text-[--color-text-secondary]">
              No skill requirements defined yet.
            </div>
          ) : (
            requirements.map((requirement, index) => {
              const assignedMembers = teamMembers.filter((member) =>
                requirement.assignedMembers.includes(member.id)
              );
              const isFulfilled = assignedMembers.length > 0;

              return (
                <Card key={requirement.skillId} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-[--color-text-primary]">
                        {requirement.skillName}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {requirement.category}
                      </Badge>
                      {requirement.isRequired && (
                        <Badge
                          variant={isFulfilled ? 'secondary' : 'destructive'}
                          className="text-xs"
                        >
                          {requirement.isRequired ? 'Required' : 'Optional'}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-[--color-text-secondary]">
                      Min. Level {requirement.minProficiency}
                    </div>
                  </div>

                  {/* Assigned Members */}
                  {assignedMembers.length > 0 && (
                    <div className="mb-3">
                      <div className="text-sm font-medium text-[--color-text-primary] mb-2">
                        Assigned Members ({assignedMembers.length})
                      </div>
                      <div className="space-y-2">
                        {assignedMembers.map((member) => {
                          const skillMatch = getMemberSkillMatch(
                            member,
                            requirement.skillId
                          );
                          const displayName =
                            [member.firstName, member.lastName]
                              .filter(Boolean)
                              .join(' ') || 'Anonymous User';

                          return (
                            <div
                              key={member.id}
                              className="flex items-center justify-between p-2 bg-[--color-surface] rounded-[--border-radius-sm]"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{displayName}</span>
                                {skillMatch && (
                                  <SkillBadge
                                    skill={skillMatch.skill}
                                    proficiencyLevel={
                                      skillMatch.proficiencyLevel
                                    }
                                    isVerified={skillMatch.isVerified}
                                    variant="compact"
                                  />
                                )}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleUnassignSkill(index, member.id)
                                }
                                className="text-xs h-6"
                              >
                                Unassign
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Available Team Members */}
                  <div>
                    <div className="text-sm font-medium text-[--color-text-primary] mb-2">
                      Available Team Members
                    </div>
                    <div className="space-y-1">
                      {teamMembers
                        .filter(
                          (member) =>
                            !requirement.assignedMembers.includes(member.id)
                        )
                        .map((member) => {
                          const skillMatch = getMemberSkillMatch(
                            member,
                            requirement.skillId
                          );
                          const displayName =
                            [member.firstName, member.lastName]
                              .filter(Boolean)
                              .join(' ') || 'Anonymous User';
                          const canAssign =
                            skillMatch &&
                            skillMatch.proficiencyLevel >=
                              requirement.minProficiency;

                          return (
                            <div
                              key={member.id}
                              className="flex items-center justify-between p-2 hover:bg-[--color-surface-hover] rounded-[--border-radius-sm]"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{displayName}</span>
                                {skillMatch ? (
                                  <SkillBadge
                                    skill={skillMatch.skill}
                                    proficiencyLevel={
                                      skillMatch.proficiencyLevel
                                    }
                                    isVerified={skillMatch.isVerified}
                                    variant="compact"
                                  />
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="text-xs text-orange-600"
                                  >
                                    No skill
                                  </Badge>
                                )}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleAssignSkill(index, member.id)
                                }
                                disabled={!canAssign}
                                className={cn(
                                  'text-xs h-6',
                                  canAssign
                                    ? 'text-green-600 hover:text-green-700'
                                    : 'opacity-50'
                                )}
                              >
                                {canAssign ? 'Assign' : "Can't assign"}
                              </Button>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* Suggestions Tab */}
      {activeTab === 'suggestions' && (
        <div className="space-y-4">
          {/* Search */}
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for team members..."
            className="max-w-md"
          />

          {/* Skill Gaps Alert */}
          {skillGaps.length > 0 && (
            <Card className="p-4 border-red-200 bg-red-50">
              <h3 className="font-medium text-red-800 mb-2">
                Critical Skill Gaps ({skillGaps.length})
              </h3>
              <div className="flex flex-wrap gap-1">
                {skillGaps.map((gap) => (
                  <Badge
                    key={gap.skillId}
                    variant="destructive"
                    className="text-xs"
                  >
                    {gap.skillName}
                  </Badge>
                ))}
              </div>
            </Card>
          )}

          {/* Suggested Members */}
          <div className="space-y-3">
            {isLoadingMatches ? (
              <div className="text-center py-8 text-[--color-text-secondary]">
                Loading suggestions...
              </div>
            ) : filteredSuggestions.length === 0 ? (
              <div className="text-center py-8 text-[--color-text-secondary]">
                No suggestions available
              </div>
            ) : (
              filteredSuggestions.map((suggestion) => {
                if ('userId' in suggestion) {
                  // This is a user skill match
                  return (
                    <MatchCard
                      key={suggestion.userId}
                      match={suggestion}
                      type="user"
                      onContact={() => {
                        // Convert the suggestion to a team member format
                        const teamMember: TeamMember = {
                          id: suggestion.userId,
                          firstName: suggestion.user.firstName,
                          lastName: suggestion.user.lastName,
                          imageUrl: suggestion.user.imageUrl,
                          location: suggestion.user.location,
                          skills: [], // You'd need to fetch this separately
                        };
                        handleAddTeamMember(teamMember);
                      }}
                      onViewDetails={() => {
                        // Handle view profile
                        // View profile functionality would be implemented here
                      }}
                    />
                  );
                }
                return null;
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
