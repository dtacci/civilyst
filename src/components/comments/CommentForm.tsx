'use client';

import { useState } from 'react';
import { api } from '~/lib/trpc';
import type { CommentData } from './Comment';

interface CommentFormProps {
  campaignId: string;
  onCommentAdded?: (comment: CommentData) => void;
}

export function CommentForm({ campaignId, onCommentAdded }: CommentFormProps) {
  const [content, setContent] = useState('');

  const createMutation = api.comments.create.useMutation({
    onSuccess: (newComment) => {
      setContent('');
      onCommentAdded?.(newComment);
    },
    onError: (error) => {
      alert('Failed to post comment. Please try again.');
      console.error('Create comment error:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (content.trim().length === 0) {
      return;
    }

    createMutation.mutate({
      content: content.trim(),
      campaignId,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="comment" className="sr-only">
          Add a comment
        </label>
        <textarea
          id="comment"
          name="comment"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          rows={4}
          maxLength={2000}
          placeholder="Share your thoughts on this campaign... (Cmd/Ctrl + Enter to submit)"
          disabled={createMutation.isPending}
        />
        <div className="flex items-center justify-between mt-2">
          <div className="text-sm text-gray-500">
            {content.length}/2000 characters
          </div>
          <div className="text-xs text-gray-400">
            Tip: Press Cmd+Enter (Mac) or Ctrl+Enter (PC) to submit quickly
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          Join the conversation and share your perspective on this campaign.
        </div>
        <button
          type="submit"
          disabled={createMutation.isPending || content.trim().length === 0}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createMutation.isPending ? (
            <div className="flex items-center space-x-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Posting...</span>
            </div>
          ) : (
            'Post Comment'
          )}
        </button>
      </div>
    </form>
  );
}
