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
import {
  VerificationRequestStatus,
  VerificationDecision,
  VerificationRequestType,
} from '~/generated/prisma';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Award,
  Calendar,
} from 'lucide-react';

interface VerificationRequest {
  id: string;
  requestType: VerificationRequestType;
  message?: string;
  evidence?: Record<string, unknown>;
  status: VerificationRequestStatus;
  reviewNotes?: string;
  decision?: VerificationDecision;
  decisionReason?: string;
  createdAt: Date;
  reviewedAt?: Date;
  userSkill: {
    id: string;
    proficiencyLevel: number;
    skill: {
      id: string;
      name: string;
      category: string;
    };
    user: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      imageUrl: string | null;
    };
  };
  requester: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
  };
  adminAssigned?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
}

interface VerificationRequestCardProps {
  request: VerificationRequest;
  canReview?: boolean;
  onRequestUpdated?: () => void;
  className?: string;
}

export function VerificationRequestCard({
  request,
  canReview = false,
  onRequestUpdated,
  className,
}: VerificationRequestCardProps) {
  const getStatusIcon = (status: VerificationRequestStatus) => {
    switch (status) {
      case VerificationRequestStatus.PENDING:
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case VerificationRequestStatus.IN_REVIEW:
        return <AlertTriangle className="w-4 h-4 text-blue-600" />;
      case VerificationRequestStatus.COMPLETED:
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case VerificationRequestStatus.REJECTED:
        return <XCircle className="w-4 h-4 text-red-600" />;
      case VerificationRequestStatus.CANCELLED:
        return <XCircle className="w-4 h-4 text-gray-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: VerificationRequestStatus) => {
    switch (status) {
      case VerificationRequestStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case VerificationRequestStatus.IN_REVIEW:
        return 'bg-blue-100 text-blue-800';
      case VerificationRequestStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case VerificationRequestStatus.REJECTED:
        return 'bg-red-100 text-red-800';
      case VerificationRequestStatus.CANCELLED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getDecisionColor = (decision?: VerificationDecision) => {
    if (!decision) return '';
    switch (decision) {
      case VerificationDecision.APPROVED:
        return 'bg-green-100 text-green-800';
      case VerificationDecision.REJECTED:
        return 'bg-red-100 text-red-800';
      case VerificationDecision.NEEDS_MORE_EVIDENCE:
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const requesterName =
    [request.requester.firstName, request.requester.lastName]
      .filter(Boolean)
      .join(' ') || 'Anonymous User';

  const userName =
    [request.userSkill.user.firstName, request.userSkill.user.lastName]
      .filter(Boolean)
      .join(' ') || 'Anonymous User';

  return (
    <Card className={cn('p-4', className)}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="flex items-center gap-2">
              {getStatusIcon(request.status)}
              <div>
                <h3 className="font-medium text-[--color-text-primary]">
                  {request.userSkill.skill.name} Verification Request
                </h3>
                <div className="text-sm text-[--color-text-secondary]">
                  by {requesterName} for {userName}
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge className={cn('text-xs', getStatusColor(request.status))}>
              {request.status.replace('_', ' ').toLowerCase()}
            </Badge>
            {request.decision && (
              <Badge
                className={cn('text-xs', getDecisionColor(request.decision))}
              >
                {request.decision.replace('_', ' ').toLowerCase()}
              </Badge>
            )}
          </div>
        </div>

        {/* Skill Info */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Award className="w-3 h-3" />
            <span>Level {request.userSkill.proficiencyLevel}/5</span>
          </div>
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span>{request.userSkill.skill.category}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{new Date(request.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Request Message */}
        {request.message && (
          <div className="p-3 bg-[--color-surface] rounded-[--border-radius-md]">
            <div className="text-sm font-medium text-[--color-text-primary] mb-1">
              Request Message:
            </div>
            <p className="text-sm text-[--color-text-secondary]">
              {request.message}
            </p>
          </div>
        )}

        {/* Evidence */}
        {request.evidence && (
          <div className="p-3 bg-[--color-surface] rounded-[--border-radius-md]">
            <div className="text-sm font-medium text-[--color-text-primary] mb-1">
              Evidence Provided:
            </div>
            <pre className="text-xs text-[--color-text-secondary] whitespace-pre-wrap">
              {JSON.stringify(request.evidence, null, 2)}
            </pre>
          </div>
        )}

        {/* Review Info */}
        {(request.reviewNotes || request.decisionReason) && (
          <div className="p-3 bg-[--color-surface] rounded-[--border-radius-md]">
            <div className="text-sm font-medium text-[--color-text-primary] mb-1">
              Review Notes:
            </div>
            {request.reviewNotes && (
              <p className="text-sm text-[--color-text-secondary] mb-2">
                {request.reviewNotes}
              </p>
            )}
            {request.decisionReason && (
              <p className="text-sm text-[--color-text-secondary]">
                <span className="font-medium">Decision Reason:</span>{' '}
                {request.decisionReason}
              </p>
            )}
            {request.reviewedAt && (
              <div className="text-xs text-[--color-text-secondary] mt-2">
                Reviewed on {new Date(request.reviewedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        )}

        {/* Admin Assignment */}
        {request.adminAssigned && (
          <div className="text-xs text-[--color-text-secondary]">
            Assigned to:{' '}
            {[request.adminAssigned.firstName, request.adminAssigned.lastName]
              .filter(Boolean)
              .join(' ') || 'Admin'}
          </div>
        )}

        {/* Actions */}
        {canReview &&
          request.status !== VerificationRequestStatus.COMPLETED && (
            <div className="flex gap-2">
              <ReviewRequestDialog
                request={request}
                onRequestReviewed={onRequestUpdated}
              >
                <Button size="sm" variant="outline">
                  Review Request
                </Button>
              </ReviewRequestDialog>
            </div>
          )}
      </div>
    </Card>
  );
}

interface ReviewRequestDialogProps {
  request: VerificationRequest;
  onRequestReviewed?: () => void;
  children: React.ReactNode;
}

export function ReviewRequestDialog({
  request,
  onRequestReviewed,
  children,
}: ReviewRequestDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [decision, setDecision] = useState<VerificationDecision>(
    VerificationDecision.APPROVED
  );
  const [reviewNotes, setReviewNotes] = useState('');
  const [decisionReason, setDecisionReason] = useState('');

  const { mutate: reviewRequest, isPending: isLoading } =
    api.verification.reviewVerificationRequest.useMutation({
      onSuccess: () => {
        toast.success('Verification request reviewed successfully');
        setIsOpen(false);
        setReviewNotes('');
        setDecisionReason('');
        onRequestReviewed?.();
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to review verification request');
      },
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    reviewRequest({
      requestId: request.id,
      decision,
      reviewNotes: reviewNotes.trim() || undefined,
      decisionReason: decisionReason.trim() || undefined,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Review Verification Request</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Request Summary */}
          <div className="p-3 bg-[--color-surface] rounded-[--border-radius-md]">
            <div className="text-sm font-medium text-[--color-text-primary] mb-1">
              Request Summary:
            </div>
            <p className="text-sm text-[--color-text-secondary]">
              {request.userSkill.skill.name} skill verification for{' '}
              {[
                request.userSkill.user.firstName,
                request.userSkill.user.lastName,
              ]
                .filter(Boolean)
                .join(' ') || 'user'}{' '}
              (Level {request.userSkill.proficiencyLevel}/5)
            </p>
          </div>

          {/* Decision */}
          <div>
            <label className="text-sm font-medium text-[--color-text-primary] mb-2 block">
              Decision *
            </label>
            <Select
              value={decision}
              onValueChange={(value: VerificationDecision) =>
                setDecision(value)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={VerificationDecision.APPROVED}>
                  Approved - Skill is verified
                </SelectItem>
                <SelectItem value={VerificationDecision.REJECTED}>
                  Rejected - Insufficient evidence or skills don&apos;t match
                </SelectItem>
                <SelectItem value={VerificationDecision.NEEDS_MORE_EVIDENCE}>
                  Needs More Evidence - Request additional documentation
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Decision Reason */}
          <div>
            <label className="text-sm font-medium text-[--color-text-primary] mb-2 block">
              Decision Reason
            </label>
            <Textarea
              value={decisionReason}
              onChange={(e) => setDecisionReason(e.target.value)}
              placeholder="Explain your decision to the user..."
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-[--color-text-secondary] mt-1">
              {decisionReason.length}/500 characters
            </div>
          </div>

          {/* Review Notes */}
          <div>
            <label className="text-sm font-medium text-[--color-text-primary] mb-2 block">
              Internal Review Notes
            </label>
            <Textarea
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder="Internal notes for record keeping..."
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-[--color-text-secondary] mt-1">
              These notes are for internal use only. {reviewNotes.length}/500
              characters
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
              {isLoading ? 'Submitting...' : 'Submit Review'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface RequestVerificationDialogProps {
  userSkillId: string;
  skillName: string;
  onRequestSubmitted?: () => void;
  children: React.ReactNode;
}

export function RequestVerificationDialog({
  userSkillId,
  skillName,
  onRequestSubmitted,
  children,
}: RequestVerificationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [evidence, setEvidence] = useState('');

  const { mutate: requestVerification, isPending: isLoading } =
    api.verification.requestVerification.useMutation({
      onSuccess: () => {
        toast.success('Verification request submitted successfully');
        setIsOpen(false);
        setMessage('');
        setEvidence('');
        onRequestSubmitted?.();
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to submit verification request');
      },
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const evidenceData = evidence.trim()
      ? { description: evidence.trim() }
      : undefined;

    requestVerification({
      userSkillId,
      message: message.trim() || undefined,
      evidence: evidenceData,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request Verification for {skillName}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Information */}
          <div className="p-3 bg-blue-50 rounded-[--border-radius-md] text-sm">
            <p className="text-blue-800">
              Skill verification helps build trust in the community. Provide any
              relevant information or evidence to support your skill level.
            </p>
          </div>

          {/* Message */}
          <div>
            <label className="text-sm font-medium text-[--color-text-primary] mb-2 block">
              Additional Context (optional)
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us about your experience with this skill..."
              rows={3}
              maxLength={500}
            />
            <div className="text-xs text-[--color-text-secondary] mt-1">
              {message.length}/500 characters
            </div>
          </div>

          {/* Evidence */}
          <div>
            <label className="text-sm font-medium text-[--color-text-primary] mb-2 block">
              Evidence Description (optional)
            </label>
            <Textarea
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              placeholder="Describe any portfolio items, certificates, or work history that demonstrates this skill..."
              rows={4}
              maxLength={1000}
            />
            <div className="text-xs text-[--color-text-secondary] mt-1">
              Mention any portfolio items, certificates, or endorsements you
              have for this skill. {evidence.length}/1000 characters
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
              {isLoading ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

interface VerificationRequestListProps {
  userId?: string;
  status?: VerificationRequestStatus;
  canReview?: boolean;
  limit?: number;
  className?: string;
}

export function VerificationRequestList({
  userId,
  status,
  canReview = false,
  limit = 20,
  className,
}: VerificationRequestListProps) {
  const {
    data: requests,
    isLoading,
    refetch,
  } = api.verification.getVerificationRequests.useQuery({
    userId,
    status,
    limit,
  });

  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 bg-gray-200 rounded animate-pulse w-48" />
              </div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-64" />
              <div className="h-3 bg-gray-200 rounded animate-pulse w-32" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!requests || requests.length === 0) {
    return (
      <div
        className={cn(
          'text-center py-8 text-[--color-text-secondary]',
          className
        )}
      >
        No verification requests found.
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {requests.map((request) => (
        <VerificationRequestCard
          key={request.id}
          request={request}
          canReview={canReview}
          onRequestUpdated={() => refetch()}
        />
      ))}
    </div>
  );
}
