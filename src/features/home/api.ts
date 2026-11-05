import type {
  CommunityComment,
  CommunityPage,
  CommunityPost,
  CreateCommunityCommentInput,
  CreateCommunityPostInput,
} from './types';
import {
  boardPostsRepository,
  storageRepository,
  type BoardPageOptions,
  type CreateBoardCommentInput,
  type CreateBoardPostInput,
} from '../../lib/db';
import { newUuid } from '../../lib/uuid';

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
  // Pre-generating the ID lets images be uploaded to `<uid>/<postId>/` first, so
  // the row is inserted once with its final images and needs no follow-up update.
  const postId = input.images?.length ? newUuid() : null;
  let uploadedPaths: string[] = [];
  try {
    if (postId && input.images) {
      const images = await storageRepository.uploadPostImages(postId, input.images);
      uploadedPaths = images.map((image) => image.path);
      databaseInput.id = postId;
      databaseInput.images = images;
    }
    return await boardPostsRepository.createPost(databaseInput);
  } catch (error) {
    await storageRepository.remove('post-images', uploadedPaths).catch(() => undefined);
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
