import type {
  BoardAuthorDto,
  BoardCommentDto,
  BoardPage,
  BoardPageOptions,
  BoardPostDto,
} from '../../lib/db';

// Community-facing names mirror the repository DTOs. Keeping these aliases in
// the feature module gives screens one stable import point if DB DTOs evolve.
export type CommunityAuthor = BoardAuthorDto;
export type CommunityPost = BoardPostDto;
export type CommunityComment = BoardCommentDto;
export type CommunityPage<T> = BoardPage<T>;
export type CommunityPageOptions = BoardPageOptions;

export type CreateCommunityPostInput = {
  title: string;
  body: string;
};

// The API maps postId to the database's post_id field; callers never provide
// authorId because the repository derives it from the active Auth session.
export type CreateCommunityCommentInput = {
  postId: string;
  body: string;
};
