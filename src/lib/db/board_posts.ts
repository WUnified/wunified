import type { Tables, TablesInsert } from '../../types/database';
import { supabase } from '../supabase';

// Keep raw database rows and wire-format insert fields inside this module. The
// feature layer receives camelCase DTOs and cannot supply ownership IDs.
type BoardPostRow = Pick<
  Tables<'board_posts'>,
  'id' | 'author_id' | 'title' | 'body' | 'created_at' | 'updated_at'
>;
type BoardCommentRow = Pick<
  Tables<'board_comments'>,
  'id' | 'post_id' | 'author_id' | 'body' | 'created_at' | 'updated_at'
>;
type PublicProfileRow = Pick<
  Tables<'public_profiles'>,
  'user_id' | 'username' | 'display_name' | 'avatar' | 'wsu_verified'
>;
type BoardPostInsert = Omit<TablesInsert<'board_posts'>, 'author_id'>;
type BoardCommentInsert = Omit<TablesInsert<'board_comments'>, 'author_id'>;

export type BoardAuthorDto = {
  userId: string;
  username: string;
  displayName: string;
  avatar: string | null;
  wsuVerified: boolean;
};

export type BoardPostDto = {
  id: string;
  authorId: string;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: BoardAuthorDto | null;
};

export type BoardCommentDto = {
  id: string;
  postId: string;
  authorId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: BoardAuthorDto | null;
};

export type BoardPageOptions = {
  page?: number;
  pageSize?: number;
};

export type BoardPage<T> = {
  items: T[];
  hasMore: boolean;
  // Null means the extra-row check found no next page.
  nextPage: number | null;
};

export type CreateBoardPostInput = Pick<BoardPostInsert, 'title' | 'body'>;
export type CreateBoardCommentInput = Pick<BoardCommentInsert, 'post_id' | 'body'>;

export type BoardPostsRepositoryErrorCode =
  'CONFIGURATION' | 'UNAUTHENTICATED' | 'VALIDATION' | 'PERMISSION' | 'DATABASE';

export class BoardPostsRepositoryError extends Error {
  readonly code: BoardPostsRepositoryErrorCode;

  constructor(code: BoardPostsRepositoryErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'BoardPostsRepositoryError';
    this.code = code;
  }
}

const DEFAULT_POST_PAGE_SIZE = 20;
const DEFAULT_COMMENT_PAGE_SIZE = 30;
const MAX_PAGE_SIZE = 100;
const POST_COLUMNS = 'id, author_id, title, body, created_at, updated_at';
const COMMENT_COLUMNS = 'id, post_id, author_id, body, created_at, updated_at';
const AUTHOR_COLUMNS = 'user_id, username, display_name, avatar, wsu_verified';

// Fetch one extra row to determine hasMore without a separate count query.
function getPage(options: BoardPageOptions, defaultPageSize: number) {
  const page = options.page ?? 0;
  const pageSize = options.pageSize ?? defaultPageSize;
  const offset = page * pageSize;

  if (
    !Number.isSafeInteger(page) ||
    page < 0 ||
    !Number.isSafeInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > MAX_PAGE_SIZE ||
    !Number.isSafeInteger(offset)
  ) {
    throw new BoardPostsRepositoryError(
      'VALIDATION',
      `Page must be a non-negative integer and page size must be between 1 and ${MAX_PAGE_SIZE}.`,
    );
  }

  return { page, pageSize, offset };
}

function parseBoardPostRow(value: unknown): BoardPostRow {
  if (typeof value !== 'object' || value === null) {
    throw new BoardPostsRepositoryError('DATABASE', 'Supabase returned an invalid board post.');
  }

  const row = value as Record<string, unknown>;
  if (
    typeof row.id !== 'string' ||
    typeof row.author_id !== 'string' ||
    typeof row.title !== 'string' ||
    typeof row.body !== 'string' ||
    typeof row.created_at !== 'string' ||
    typeof row.updated_at !== 'string'
  ) {
    throw new BoardPostsRepositoryError('DATABASE', 'Supabase returned an invalid board post.');
  }

  return {
    id: row.id,
    author_id: row.author_id,
    title: row.title,
    body: row.body,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function parseBoardCommentRow(value: unknown): BoardCommentRow {
  if (typeof value !== 'object' || value === null) {
    throw new BoardPostsRepositoryError('DATABASE', 'Supabase returned an invalid board comment.');
  }

  const row = value as Record<string, unknown>;
  if (
    typeof row.id !== 'string' ||
    typeof row.post_id !== 'string' ||
    typeof row.author_id !== 'string' ||
    typeof row.body !== 'string' ||
    typeof row.created_at !== 'string' ||
    typeof row.updated_at !== 'string'
  ) {
    throw new BoardPostsRepositoryError('DATABASE', 'Supabase returned an invalid board comment.');
  }

  return {
    id: row.id,
    post_id: row.post_id,
    author_id: row.author_id,
    body: row.body,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function mapBoardPost(row: BoardPostRow, authors: Map<string, BoardAuthorDto>): BoardPostDto {
  return {
    id: row.id,
    authorId: row.author_id,
    title: row.title,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: authors.get(row.author_id) ?? null,
  };
}

function mapBoardComment(
  row: BoardCommentRow,
  authors: Map<string, BoardAuthorDto>,
): BoardCommentDto {
  return {
    id: row.id,
    postId: row.post_id,
    authorId: row.author_id,
    body: row.body,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    author: authors.get(row.author_id) ?? null,
  };
}

// This repository is the only community module that touches Supabase. Its
// methods translate query failures into repository errors and attach public
// author data before returning results to the feature API.
export class BoardPostsRepository {
  private getClient() {
    if (!supabase) {
      throw new BoardPostsRepositoryError('CONFIGURATION', 'Supabase is not configured.');
    }

    return supabase;
  }

  private mapSupabaseError(
    operation: string,
    resource: 'board post' | 'board comment' | 'public author',
    error: { code?: string; message: string },
  ) {
    if (error.code === '42501') {
      return new BoardPostsRepositoryError(
        'PERMISSION',
        `You do not have permission to ${operation}.`,
        { cause: error },
      );
    }

    if (['22P02', '23503', '23514'].includes(error.code ?? '')) {
      return new BoardPostsRepositoryError('VALIDATION', `The ${resource} data is invalid.`, {
        cause: error,
      });
    }

    return new BoardPostsRepositoryError(
      'DATABASE',
      `Failed to ${operation} ${resource}: ${error.message}`,
      { cause: error },
    );
  }

  private async getCurrentUserId() {
    const { data, error } = await this.getClient().auth.getUser();
    // Missing or expired sessions can arrive as an Auth error with no user.
    if (error || !data.user) {
      throw new BoardPostsRepositoryError(
        'UNAUTHENTICATED',
        'You must be signed in to create board content.',
        error ? { cause: error } : undefined,
      );
    }

    return data.user.id;
  }

  private async getAuthors(userIds: string[]): Promise<Map<string, BoardAuthorDto>> {
    const uniqueIds = [...new Set(userIds)];
    if (uniqueIds.length === 0) return new Map();

    // Board FKs point at private profiles, so fetch the approved public
    // projection separately instead of embedding a private-profile relation.
    const { data, error } = await this.getClient()
      .from('public_profiles')
      .select(AUTHOR_COLUMNS)
      .in('user_id', uniqueIds);
    if (error) {
      throw this.mapSupabaseError('load authors for', 'public author', error);
    }

    const profiles = data as unknown as PublicProfileRow[];
    return new Map(
      profiles.map((profile) => [
        profile.user_id,
        {
          userId: profile.user_id,
          username: profile.username,
          displayName: profile.display_name,
          avatar: profile.avatar,
          wsuVerified: profile.wsu_verified,
        },
      ]),
    );
  }

  async listPosts(options: BoardPageOptions = {}): Promise<BoardPage<BoardPostDto>> {
    const { page, pageSize, offset } = getPage(options, DEFAULT_POST_PAGE_SIZE);
    const { data, error } = await this.getClient()
      .from('board_posts')
      .select(POST_COLUMNS)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      // PostgREST ranges are inclusive at both ends; the extra row detects more data.
      .range(offset, offset + pageSize);
    if (error) throw this.mapSupabaseError('load', 'board post', error);

    const rows = data as unknown as BoardPostRow[];
    const hasMore = rows.length > pageSize;
    const visibleRows = rows.slice(0, pageSize);
    const authors = await this.getAuthors(visibleRows.map((row) => row.author_id));
    return {
      items: visibleRows.map((row) => mapBoardPost(row, authors)),
      hasMore,
      nextPage: hasMore ? page + 1 : null,
    };
  }

  async listComments(
    postId: string,
    options: BoardPageOptions = {},
  ): Promise<BoardPage<BoardCommentDto>> {
    if (!postId.trim()) {
      throw new BoardPostsRepositoryError('VALIDATION', 'A board post ID is required.');
    }

    const { page, pageSize, offset } = getPage(options, DEFAULT_COMMENT_PAGE_SIZE);
    const { data, error } = await this.getClient()
      .from('board_comments')
      .select(COMMENT_COLUMNS)
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .range(offset, offset + pageSize);
    if (error) throw this.mapSupabaseError('load', 'board comment', error);

    const rows = data as unknown as BoardCommentRow[];
    const hasMore = rows.length > pageSize;
    const visibleRows = rows.slice(0, pageSize);
    const authors = await this.getAuthors(visibleRows.map((row) => row.author_id));
    return {
      items: visibleRows.map((row) => mapBoardComment(row, authors)),
      hasMore,
      nextPage: hasMore ? page + 1 : null,
    };
  }

  async createPost(input: CreateBoardPostInput): Promise<BoardPostDto> {
    const title = input.title.trim();
    const body = input.body.trim();
    if (!title || !body) {
      throw new BoardPostsRepositoryError('VALIDATION', 'A title and post body are required.');
    }

    // Never trust client-supplied ownership; RLS independently checks this ID.
    const insert: TablesInsert<'board_posts'> = {
      title,
      body,
      author_id: await this.getCurrentUserId(),
    };
    const { data, error } = await this.getClient()
      .from('board_posts')
      .insert(insert)
      .select(POST_COLUMNS)
      .single();
    if (error) throw this.mapSupabaseError('create', 'board post', error);

    const row = parseBoardPostRow(data);
    const authors = await this.getAuthors([row.author_id]);
    return mapBoardPost(row, authors);
  }

  async createComment(input: CreateBoardCommentInput): Promise<BoardCommentDto> {
    const postId = input.post_id.trim();
    const body = input.body.trim();
    if (!postId || !body) {
      throw new BoardPostsRepositoryError('VALIDATION', 'A post ID and comment body are required.');
    }

    const insert: TablesInsert<'board_comments'> = {
      post_id: postId,
      body,
      author_id: await this.getCurrentUserId(),
    };
    const { data, error } = await this.getClient()
      .from('board_comments')
      .insert(insert)
      .select(COMMENT_COLUMNS)
      .single();
    if (error) throw this.mapSupabaseError('create', 'board comment', error);

    const row = parseBoardCommentRow(data);
    const authors = await this.getAuthors([row.author_id]);
    return mapBoardComment(row, authors);
  }
}

export const boardPostsRepository = new BoardPostsRepository();
