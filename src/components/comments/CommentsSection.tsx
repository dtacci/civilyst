'use client';

import { useState, useEffect } from 'react';
import { api } from '~/lib/trpc';
import { Comment, type CommentData } from './Comment';
import { CommentForm } from './CommentForm';

interface CommentsSectionProps {
  campaignId: string;
  currentUserId?: string;
}

export function CommentsSection({ campaignId, currentUserId }: CommentsSectionProps) {
  const [comments, setComments] = useState<CommentData[]>([]);

  const { data: commentsData, isLoading, error } = api.comments.getComments.useQuery({
    campaignId,
    limit: 20,
  });

  const { data: countData } = api.comments.getCount.useQuery({
    campaignId,
  });

  useEffect(() => {
    if (commentsData?.comments) {
      setComments(commentsData.comments);
    }
  }, [commentsData]);

  const handleCommentAdded = (newComment: CommentData) => {
    setComments((prev) => [newComment, ...prev]);
  };

  const handleCommentUpdated = (updatedComment: CommentData) => {
    setComments((prev) =>
      prev.map((comment) =>
        comment.id === updatedComment.id ? updatedComment : comment
      )
    );
  };

  const handleCommentDeleted = (commentId: string) => {
    setComments((prev) => prev.filter((comment) => comment.id !== commentId));
  };

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Comments ({countData?.count || 0})
        </h3>
        <div className="text-center py-8 text-red-600">
          <p>Failed to load comments. Please try again later.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Comments ({countData?.count || comments.length})
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Share your thoughts and engage with the community
        </p>
      </div>

      {/* Comment Form */}
      <div className="px-6 py-6 border-b border-gray-200 bg-gray-50">
        <CommentForm
          campaignId={campaignId}
          onCommentAdded={handleCommentAdded}
        />
      </div>

      {/* Comments List */}
      <div className="px-6 py-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-300 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 rounded w-1/4 mb-2"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-300 rounded w-full"></div>
                      <div className="h-3 bg-gray-300 rounded w-3/4"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : comments.length > 0 ? (
          <div className="space-y-0">
            {comments.map((comment) => (
              <Comment
                key={comment.id}
                comment={comment}
                currentUserId={currentUserId}
                onUpdate={handleCommentUpdated}
                onDelete={handleCommentDeleted}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              No comments yet
            </h4>
            <p className="text-gray-600 mb-4">
              Be the first to share your thoughts on this campaign!
            </p>
          </div>
        )}

        {/* Load More (if needed) */}
        {commentsData?.hasMore && (
          <div className="mt-6 text-center">
            <button
              className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
              onClick={() => {
                // TODO: Implement load more functionality
                console.log('Load more comments');
              }}
            >
              Load more comments
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
