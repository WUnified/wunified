import type {
  CommunityComment,
  CommunityPage,
  CommunityPost,
  CreateCommunityCommentInput,
  CreateCommunityPostInput,
} from './types';
import {
  boardPostsRepository,
  type BoardPageOptions,
  type CreateBoardCommentInput,
  type CreateBoardPostInput,
} from '../../lib/db';

// This feature boundary adds operation-specific context while preserving the
// database adapter as the sole owner of Supabase queries.
export async function loadCommunityPosts(
  options: BoardPageOptions = {},
): Promise<CommunityPage<CommunityPost>> {
  try {
    return await boardPostsRepository.listPosts(options);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load community posts.';
    throw new Error(`Failed to load community posts: ${message}`, { cause: error });
  }
}

export async function loadCommunityComments(
  postId: string,
  options: BoardPageOptions = {},
): Promise<CommunityPage<CommunityComment>> {
  try {
    return await boardPostsRepository.listComments(postId, options);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load comments.';
    throw new Error(`Failed to load comments: ${message}`, { cause: error });
  }
}

export async function createCommunityPost(input: CreateCommunityPostInput): Promise<CommunityPost> {
  // Keep the UI contract camelCase/ownership-free; translate to the DB contract here.
  const databaseInput: CreateBoardPostInput = { title: input.title, body: input.body };
  try {
    return await boardPostsRepository.createPost(databaseInput);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create the post.';
    throw new Error(`Failed to create community post: ${message}`, { cause: error });
  }
}

export async function createCommunityComment(
  input: CreateCommunityCommentInput,
): Promise<CommunityComment> {
  const databaseInput: CreateBoardCommentInput = { post_id: input.postId, body: input.body };
  try {
    return await boardPostsRepository.createComment(databaseInput);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create the comment.';
    throw new Error(`Failed to create community comment: ${message}`, { cause: error });
  }
}
