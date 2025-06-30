import { z } from 'zod';
import {
  createTRPCRouter,
  rateLimitedProcedure,
  loggedProcedure,
} from '~/server/api/trpc';
import { TRPCError } from '@trpc/server';
import { db } from '~/lib/db';

// Input validation schemas
const CreateCommentInput = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment too long'),
  campaignId: z.string().cuid('Invalid campaign ID'),
});

const UpdateCommentInput = z.object({
  id: z.string().cuid('Invalid comment ID'),
  content: z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment too long'),
});

const GetCommentsInput = z.object({
  campaignId: z.string().cuid('Invalid campaign ID'),
  limit: z.number().min(1).max(50).default(20),
  cursor: z.string().optional(), // for pagination
});

export const commentsRouter = createTRPCRouter({
  // Get comments for a campaign
  getComments: rateLimitedProcedure
    .input(GetCommentsInput)
    .query(async ({ input }) => {
      try {
        // Mock implementation for now
        const mockComments = [
          {
            id: 'comment_1',
            content: 'This is a great initiative! I fully support this campaign.',
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
            campaignId: input.campaignId,
            authorId: 'user_1',
            author: {
              id: 'user_1',
              firstName: 'Sarah',
              lastName: 'Johnson',
              imageUrl: null,
            },
          },
          {
            id: 'comment_2',
            content: 'I have some concerns about the environmental impact. Could you provide more details about the sustainability measures?',
            createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
            updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
            campaignId: input.campaignId,
            authorId: 'user_2',
            author: {
              id: 'user_2',
              firstName: 'Mike',
              lastName: 'Chen',
              imageUrl: null,
            },
          },
          {
            id: 'comment_3',
            content: 'As a local business owner, I think this would benefit our community greatly. Count me in!',
            createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
            updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
            campaignId: input.campaignId,
            authorId: 'user_3',
            author: {
              id: 'user_3',
              firstName: 'Elena',
              lastName: 'Rodriguez',
              imageUrl: null,
            },
          },
        ];

        return {
          comments: mockComments,
          hasMore: false,
          nextCursor: null,
        };

        // Real implementation (uncomment when auth is connected):
        // const comments = await db.comment.findMany({
        //   where: { campaignId: input.campaignId },
        //   include: {
        //     author: {
        //       select: {
        //         id: true,
        //         firstName: true,
        //         lastName: true,
        //         imageUrl: true,
        //       },
        //     },
        //   },
        //   orderBy: { createdAt: 'desc' },
        //   take: input.limit + 1,
        //   cursor: input.cursor ? { id: input.cursor } : undefined,
        // });

        // const hasMore = comments.length > input.limit;
        // const results = hasMore ? comments.slice(0, -1) : comments;
        // const nextCursor = hasMore ? results[results.length - 1]?.id : null;

        // return {
        //   comments: results,
        //   hasMore,
        //   nextCursor,
        // };
      } catch (error) {
        console.error('Get comments error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch comments',
        });
      }
    }),

  // Create a new comment
  create: loggedProcedure
    .input(CreateCommentInput)
    .mutation(async ({ input }) => {
      try {
        // TODO: Get userId from Clerk when auth is connected
        // const userId = ctx.auth?.userId;
        // if (!userId) {
        //   throw new TRPCError({ code: 'UNAUTHORIZED' });
        // }

        // Mock implementation for now
        const mockComment = {
          id: `comment_${Date.now()}`,
          content: input.content,
          campaignId: input.campaignId,
          authorId: 'mock_user_id',
          createdAt: new Date(),
          updatedAt: new Date(),
          author: {
            id: 'mock_user_id',
            firstName: 'John',
            lastName: 'Doe',
            imageUrl: null,
          },
        };

        console.log('Mock comment created:', mockComment);
        return mockComment;

        // Real implementation (uncomment when database is connected):
        // // Verify campaign exists
        // const campaign = await db.campaign.findUnique({
        //   where: { id: input.campaignId },
        //   select: { id: true },
        // });

        // if (!campaign) {
        //   throw new TRPCError({
        //     code: 'NOT_FOUND',
        //     message: 'Campaign not found',
        //   });
        // }

        // const comment = await db.comment.create({
        //   data: {
        //     content: input.content,
        //     campaignId: input.campaignId,
        //     authorId: userId,
        //   },
        //   include: {
        //     author: {
        //       select: {
        //         id: true,
        //         firstName: true,
        //         lastName: true,
        //         imageUrl: true,
        //       },
        //     },
        //   },
        // });

        // return comment;
      } catch (error) {
        console.error('Create comment error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create comment',
        });
      }
    }),

  // Update a comment (only by author)
  update: loggedProcedure
    .input(UpdateCommentInput)
    .mutation(async ({ input }) => {
      try {
        // TODO: Get userId from auth
        // const userId = ctx.auth?.userId;
        // if (!userId) {
        //   throw new TRPCError({ code: 'UNAUTHORIZED' });
        // }

        // Mock implementation
        const mockUpdatedComment = {
          id: input.id,
          content: input.content,
          updatedAt: new Date(),
        };

        console.log('Mock comment updated:', mockUpdatedComment);
        return mockUpdatedComment;

        // Real implementation:
        // // Verify comment exists and user owns it
        // const existingComment = await db.comment.findUnique({
        //   where: { id: input.id },
        //   select: { authorId: true },
        // });

        // if (!existingComment) {
        //   throw new TRPCError({
        //     code: 'NOT_FOUND',
        //     message: 'Comment not found',
        //   });
        // }

        // if (existingComment.authorId !== userId) {
        //   throw new TRPCError({
        //     code: 'FORBIDDEN',
        //     message: 'You can only edit your own comments',
        //   });
        // }

        // const updatedComment = await db.comment.update({
        //   where: { id: input.id },
        //   data: { content: input.content },
        //   include: {
        //     author: {
        //       select: {
        //         id: true,
        //         firstName: true,
        //         lastName: true,
        //         imageUrl: true,
        //       },
        //     },
        //   },
        // });

        // return updatedComment;
      } catch (error) {
        console.error('Update comment error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update comment',
        });
      }
    }),

  // Delete a comment (only by author)
  delete: loggedProcedure
    .input(z.object({ id: z.string().cuid() }))
    .mutation(async ({ input }) => {
      try {
        // TODO: Get userId from auth
        // const userId = ctx.auth?.userId;
        // if (!userId) {
        //   throw new TRPCError({ code: 'UNAUTHORIZED' });
        // }

        console.log('Mock comment deleted:', input.id);
        return { success: true };

        // Real implementation:
        // // Verify comment exists and user owns it
        // const existingComment = await db.comment.findUnique({
        //   where: { id: input.id },
        //   select: { authorId: true },
        // });

        // if (!existingComment) {
        //   throw new TRPCError({
        //     code: 'NOT_FOUND',
        //     message: 'Comment not found',
        //   });
        // }

        // if (existingComment.authorId !== userId) {
        //   throw new TRPCError({
        //     code: 'FORBIDDEN',
        //     message: 'You can only delete your own comments',
        //   });
        // }

        // await db.comment.delete({
        //   where: { id: input.id },
        // });

        // return { success: true };
      } catch (error) {
        console.error('Delete comment error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete comment',
        });
      }
    }),

  // Get comment count for a campaign
  getCount: rateLimitedProcedure
    .input(z.object({ campaignId: z.string().cuid() }))
    .query(async ({ input }) => {
      try {
        // Mock implementation
        return { count: 3 };

        // Real implementation:
        // const count = await db.comment.count({
        //   where: { campaignId: input.campaignId },
        // });
        // return { count };
      } catch (error) {
        console.error('Get comment count error:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to get comment count',
        });
      }
    }),
});
