'use client';

import * as React from 'react';
import { useState } from 'react';
import { Card } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { Badge } from '~/components/ui/badge';
import { Textarea } from '~/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { cn } from '~/lib/utils';
import { api } from '~/lib/trpc';
import { toast } from '~/lib/toast';
import { EndorsementStrength } from '~/generated/prisma';

interface Endorsement {
  id: string;
  message?: string;
  strength: EndorsementStrength;
  createdAt: Date;
  endorser: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
    trustScore: number;
    isVerified: boolean;
  };
}

interface EndorsementCardProps {
  endorsement: Endorsement;
  canRemove?: boolean;
  onRemove?: () => void;
  className?: string;
}

export function EndorsementCard({
  endorsement,
  canRemove = false,
  onRemove,
  className,
}: EndorsementCardProps) {
  const [isRemoving, setIsRemoving] = useState(false);

  const { mutate: removeEndorsement } =
    api.verification.removeEndorsement.useMutation({
      onSuccess: () => {
        toast.success('Endorsement removed successfully');
        onRemove?.();
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to remove endorsement');
      },
      onSettled: () => {
        setIsRemoving(false);
      },
    });

  const handleRemove = () => {
    setIsRemoving(true);
    removeEndorsement({ endorsementId: endorsement.id });
  };

  const getStrengthColor = (strength: EndorsementStrength) => {
    switch (strength) {
      case EndorsementStrength.GOOD:
        return 'bg-blue-100 text-blue-800';
      case EndorsementStrength.EXCELLENT:
        return 'bg-green-100 text-green-800';
      case EndorsementStrength.OUTSTANDING:
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStrengthLabel = (strength: EndorsementStrength) => {
    switch (strength) {
      case EndorsementStrength.GOOD:
        return 'Good';
      case EndorsementStrength.EXCELLENT:
        return 'Excellent';
      case EndorsementStrength.OUTSTANDING:
        return 'Outstanding';
      default:
        return 'Good';
    }
  };

  const endorserName =
    [endorsement.endorser.firstName, endorsement.endorser.lastName]
      .filter(Boolean)
      .join(' ') || 'Anonymous User';

  return (
    <Card className={cn('p-4', className)}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {/* Endorser Avatar */}
          {endorsement.endorser.imageUrl ? (
            <img
              src={endorsement.endorser.imageUrl}
              alt={endorserName}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-[--color-primary] text-[--color-primary-foreground] flex items-center justify-center font-medium">
              {endorserName.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1">
            {/* Endorser Info */}
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-[--color-text-primary]">
                {endorserName}
              </span>
              {endorsement.endorser.isVerified && (
                <Badge variant="secondary" className="text-xs">
                  Verified
                </Badge>
              )}
              <Badge
                className={cn(
                  'text-xs',
                  getStrengthColor(endorsement.strength)
                )}
              >
                {getStrengthLabel(endorsement.strength)}
              </Badge>
            </div>

            {/* Trust Score */}
            <div className="text-sm text-[--color-text-secondary] mb-2">
              Trust Score: {Math.round(endorsement.endorser.trustScore * 100)}%
            </div>

            {/* Endorsement Message */}
            {endorsement.message && (
              <p className="text-sm text-[--color-text-primary] mb-2">
                &ldquo;{endorsement.message}&rdquo;
              </p>
            )}

            {/* Date */}
            <div className="text-xs text-[--color-text-secondary]">
              {new Date(endorsement.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Remove Button */}
        {canRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            disabled={isRemoving}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            {isRemoving ? 'Removing...' : 'Remove'}
          </Button>
        )}
      </div>
    </Card>
  );
}

interface EndorseSkillDialogProps {
  userSkillId: string;
  skillName: string;
  userName: string;
  onEndorsementCreated?: () => void;
  children: React.ReactNode;
}

export function EndorseSkillDialog({
  userSkillId,
  skillName,
  userName,
  onEndorsementCreated,
  children,
}: EndorseSkillDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [strength, setStrength] = useState<EndorsementStrength>(
    EndorsementStrength.GOOD
  );

  const { mutate: createEndorsement, isPending: isLoading } =
    api.verification.createEndorsement.useMutation({
      onSuccess: () => {
        toast.success('Endorsement submitted successfully');
        setIsOpen(false);
        setMessage('');
        setStrength(EndorsementStrength.GOOD);
        onEndorsementCreated?.();
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to create endorsement');
      },
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEndorsement({
      userSkillId,
      message: message.trim() || undefined,
      strength,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Endorse {userName}&apos;s {skillName} skill
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Endorsement Strength */}
          <div>
            <label className="text-sm font-medium text-[--color-text-primary] mb-2 block">
              How would you rate their skill level?
            </label>
            <Select
              value={strength}
              onValueChange={(value: EndorsementStrength) => setStrength(value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={EndorsementStrength.GOOD}>
                  Good - Competent and reliable
                </SelectItem>
                <SelectItem value={EndorsementStrength.EXCELLENT}>
                  Excellent - Highly skilled and experienced
                </SelectItem>
                <SelectItem value={EndorsementStrength.OUTSTANDING}>
                  Outstanding - Exceptional expertise and innovation
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Optional Message */}
          <div>
            <label className="text-sm font-medium text-[--color-text-primary] mb-2 block">
              Add a personal message (optional)
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Share your experience working with their skills..."
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-[--color-text-secondary] mt-1">
              {message.length}/500 characters
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Submitting...' : 'Submit Endorsement'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface EndorsementListProps {
  userSkillId: string;
  currentUserId?: string;
  className?: string;
}

export function EndorsementList({
  userSkillId,
  currentUserId,
  className,
}: EndorsementListProps) {
  const {
    data: endorsements,
    isLoading,
    refetch,
  } = api.verification.getEndorsementsByUserSkill.useQuery({
    userSkillId,
  });

  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-32" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-48" />
                <div className="h-3 bg-gray-200 rounded animate-pulse w-24" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!endorsements || endorsements.length === 0) {
    return (
      <div
        className={cn(
          'text-center py-8 text-[--color-text-secondary]',
          className
        )}
      >
        No endorsements yet. Be the first to endorse this skill!
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {endorsements.map((endorsement: Endorsement) => (
        <EndorsementCard
          key={endorsement.id}
          endorsement={endorsement}
          canRemove={currentUserId === endorsement.endorser.id}
          onRemove={() => refetch()}
        />
      ))}
    </div>
  );
}
