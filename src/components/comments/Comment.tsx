'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { api } from '~/lib/trpc';
import Image from 'next/image';
import { User } from 'lucide-react';

export interface CommentData {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  campaignId: string;
  authorId: string;
  author: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
  };
}

interface CommentProps {
  comment: CommentData;
  currentUserId?: string;
  onUpdate?: (comment: CommentData) => void;
  onDelete?: (commentId: string) => void;
}

export function Comment({
  comment,
  currentUserId,
  onUpdate,
  onDelete,
}: CommentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const updateMutation = api.comments.update.useMutation({
    onSuccess: (updatedComment) => {
      setIsEditing(false);
      onUpdate?.({
        ...comment,
        content: updatedComment.content,
        updatedAt: updatedComment.updatedAt,
      });
    },
    onError: (error) => {
      alert('Failed to update comment. Please try again.');
      console.error('Update comment error:', error);
    },
  });

  const deleteMutation = api.comments.delete.useMutation({
    onSuccess: () => {
      onDelete?.(comment.id);
    },
    onError: (error) => {
      alert('Failed to delete comment. Please try again.');
      console.error('Delete comment error:', error);
    },
  });

  const handleSaveEdit = () => {
    if (editContent.trim() === comment.content.trim()) {
      setIsEditing(false);
      return;
    }

    updateMutation.mutate({
      id: comment.id,
      content: editContent.trim(),
    });
  };

  const handleCancelEdit = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this comment?')) {
      deleteMutation.mutate({ id: comment.id });
    }
  };

  const isOwner = currentUserId === comment.authorId;
  const authorName =
    `${comment.author.firstName || 'Anonymous'} ${comment.author.lastName || ''}`.trim();
  const isUpdated = comment.updatedAt.getTime() !== comment.createdAt.getTime();

  return (
    <div className="border-b border-gray-200 py-4 last:border-b-0">
      <div className="flex items-start space-x-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {comment.author.imageUrl ? (
            <Image
              src={comment.author.imageUrl}
              alt={authorName}
              width={32}
              height={32}
              priority={false}
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-[--color-surface] border border-[--color-border] flex items-center justify-center">
              <User className="w-4 h-4 text-[--color-text-tertiary]" />
            </div>
          )}
        </div>

        {/* Comment Content */}
        <div className="flex-1 min-w-0">
          {/* Author and timestamp */}
          <div className="flex items-center space-x-2 mb-1">
            <span className="font-medium text-[--color-text-primary] text-[--font-size-sm]">
              {authorName}
            </span>
            <span className="text-[--color-text-tertiary] text-[--font-size-xs]">
              •
            </span>
            <span className="text-[--color-text-tertiary] text-[--font-size-xs]">
              {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
              {isUpdated && <span className="ml-1">(edited)</span>}
            </span>
          </div>

          {/* Comment text */}
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                maxLength={2000}
                placeholder="Write your comment..."
              />
              <div className="flex items-center justify-between">
                <div className="text-[--font-size-xs] text-[--color-text-tertiary]">
                  {editContent.length}/2000 characters
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleCancelEdit}
                    disabled={updateMutation.isPending}
                    className="px-3 py-1 text-[--font-size-sm] text-[--color-text-secondary] hover:text-[--color-text-primary] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    disabled={
                      updateMutation.isPending ||
                      editContent.trim().length === 0
                    }
                    className="px-3 py-1 text-[--font-size-sm] bg-[--color-primary] text-white rounded hover:bg-[--color-primary-hover] transition-colors disabled:opacity-50"
                  >
                    {updateMutation.isPending ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-[--color-text-secondary] text-[--font-size-sm] leading-[--line-height-relaxed] whitespace-pre-wrap">
              {comment.content}
            </div>
          )}

          {/* Actions */}
          {isOwner && !isEditing && (
            <div className="flex items-center space-x-4 mt-2">
              <button
                onClick={() => setIsEditing(true)}
                className="text-[--font-size-xs] text-[--color-text-tertiary] hover:text-[--color-primary] transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="text-[--font-size-xs] text-[--color-text-tertiary] hover:text-[--color-danger] transition-colors"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
