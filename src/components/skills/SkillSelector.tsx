'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import { Input } from '~/components/ui/input';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';
import { api } from '~/lib/trpc';

interface Skill {
  id: string;
  name: string;
  category: string;
  description?: string;
}

interface SelectedSkill extends Skill {
  proficiencyLevel: number;
}

interface SkillSelectorProps {
  selectedSkills: SelectedSkill[];
  onSkillsChange: (skills: SelectedSkill[]) => void;
  maxSkills?: number;
  className?: string;
  placeholder?: string;
}

export function SkillSelector({
  selectedSkills,
  onSkillsChange,
  maxSkills = 10,
  className,
  placeholder = 'Search for skills...',
}: SkillSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Fetch skills based on search query
  const { data: searchResults, isLoading } = api.skills.search.useQuery(
    {
      query: searchQuery,
      limit: 20,
    },
    {
      enabled: searchQuery.length >= 2,
    }
  );

  // Fetch skill categories for filtering
  const { data: categories } = api.skills.getCategories.useQuery();

  // Filter skills by category if selected
  const filteredResults = React.useMemo(() => {
    if (!searchResults) return [];

    const alreadySelectedIds = new Set(selectedSkills.map((s) => s.id));
    let results = searchResults.filter(
      (skill) => !alreadySelectedIds.has(skill.id)
    );

    if (selectedCategory) {
      results = results.filter((skill) =>
        skill.category.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }

    return results;
  }, [searchResults, selectedSkills, selectedCategory]);

  const handleSkillSelect = useCallback(
    (skill: Skill) => {
      if (selectedSkills.length >= maxSkills) return;

      const newSkill: SelectedSkill = {
        ...skill,
        proficiencyLevel: 3, // Default to intermediate
      };

      onSkillsChange([...selectedSkills, newSkill]);
      setSearchQuery('');
      setIsDropdownOpen(false);
    },
    [selectedSkills, maxSkills, onSkillsChange]
  );

  const handleSkillRemove = useCallback(
    (skillId: string) => {
      onSkillsChange(selectedSkills.filter((s) => s.id !== skillId));
    },
    [selectedSkills, onSkillsChange]
  );

  const handleProficiencyChange = useCallback(
    (skillId: string, proficiencyLevel: number) => {
      onSkillsChange(
        selectedSkills.map((skill) =>
          skill.id === skillId ? { ...skill, proficiencyLevel } : skill
        )
      );
    },
    [selectedSkills, onSkillsChange]
  );

  const handleInputFocus = () => {
    setIsDropdownOpen(true);
  };

  const handleInputBlur = () => {
    // Delay closing to allow clicking on dropdown items
    setTimeout(() => setIsDropdownOpen(false), 200);
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Search Input */}
      <div className="relative">
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className="w-full"
        />

        {/* Dropdown */}
        {isDropdownOpen && (searchQuery.length >= 2 || categories) && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-[--color-surface] border border-[--color-border] rounded-[--border-radius-md] shadow-lg max-h-80 overflow-y-auto">
            {/* Category Filter */}
            {categories && categories.length > 0 && (
              <div className="p-3 border-b border-[--color-border]">
                <div className="text-xs font-medium text-[--color-text-secondary] mb-2">
                  Filter by category:
                </div>
                <div className="flex flex-wrap gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
                    className={cn(
                      'text-xs h-6',
                      selectedCategory === null &&
                        'bg-[--color-primary] text-[--color-primary-foreground]'
                    )}
                  >
                    All
                  </Button>
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className={cn(
                        'text-xs h-6',
                        selectedCategory === category &&
                          'bg-[--color-primary] text-[--color-primary-foreground]'
                      )}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results */}
            {searchQuery.length >= 2 && (
              <div className="p-2">
                {isLoading ? (
                  <div className="text-center py-4 text-[--color-text-secondary]">
                    Searching...
                  </div>
                ) : filteredResults.length === 0 ? (
                  <div className="text-center py-4 text-[--color-text-secondary]">
                    No skills found
                  </div>
                ) : (
                  filteredResults.map((skill) => (
                    <div
                      key={skill.id}
                      onClick={() => handleSkillSelect(skill)}
                      className="flex items-center justify-between p-2 hover:bg-[--color-surface-hover] cursor-pointer rounded-[--border-radius-sm]"
                    >
                      <div>
                        <div className="font-medium text-[--color-text-primary]">
                          {skill.name}
                        </div>
                        <div className="text-xs text-[--color-text-secondary]">
                          {skill.category}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="text-xs">
                        Add
                      </Button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected Skills */}
      {selectedSkills.length > 0 && (
        <div className="mt-4">
          <div className="text-sm font-medium text-[--color-text-primary] mb-2">
            Selected Skills ({selectedSkills.length}/{maxSkills})
          </div>
          <div className="space-y-2">
            {selectedSkills.map((skill) => (
              <div
                key={skill.id}
                className="flex items-center justify-between p-3 bg-[--color-surface] border border-[--color-border] rounded-[--border-radius-md]"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{skill.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {skill.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[--color-text-secondary]">
                      Proficiency:
                    </span>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <button
                          key={level}
                          onClick={() =>
                            handleProficiencyChange(skill.id, level)
                          }
                          className={cn(
                            'w-4 h-4 rounded-full border-2 transition-colors',
                            level <= skill.proficiencyLevel
                              ? 'bg-[--color-primary] border-[--color-primary]'
                              : 'border-[--color-border] hover:border-[--color-primary]'
                          )}
                          title={`Set proficiency to ${level}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSkillRemove(skill.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills limit warning */}
      {selectedSkills.length >= maxSkills && (
        <div className="mt-2 text-xs text-[--color-text-secondary]">
          Maximum number of skills reached ({maxSkills})
        </div>
      )}
    </div>
  );
}
