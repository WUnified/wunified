import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { BoardPostsRepository } from './board_posts';
import {
  AUTH_SERVICE_FAILURES,
  SIGNED_OUT_AUTH_ERRORS,
  clientWithAuthError,
} from '../../test/authFailures';

const USER_ID = '10000000-0000-0000-0000-000000000010';
const POST_ID = '30000000-0000-0000-0000-000000000003';

const mockGetUser = jest.fn(() =>
  Promise.resolve({ data: { user: { id: USER_ID } }, error: null }),
);
const mockFrom = jest.fn((_table: string): unknown => undefined);

jest.mock('../supabase', () => ({
  supabase: {
    auth: { getUser: () => mockGetUser() },
    from: (table: string) => mockFrom(table),
  },
}));

const postRow = {
  id: POST_ID,
  author_id: USER_ID,
  title: 'Hello',
  body: 'World',
  images: [],
  created_at: '2026-10-01T12:00:00.000Z',
  updated_at: '2026-10-01T12:00:00.000Z',
};

function insertChain(result: { data: unknown; error: { message: string } | null }) {
  return {
    insert: () => ({ select: () => ({ single: () => Promise.resolve(result) }) }),
  };
}

const failingAuthors = {
  select: () => ({ in: () => Promise.resolve({ data: null, error: { message: 'offline' } }) }),
};

describe('BoardPostsRepository.createPost', () => {
  beforeEach(() => {
    mockFrom.mockReset();
  });

  it('returns the committed post without an author when author hydration fails', async () => {
    mockFrom.mockImplementation((table) =>
      table === 'board_posts' ? insertChain({ data: postRow, error: null }) : failingAuthors,
    );

    // Throwing here would make the feature API delete the images of a post that exists.
    await expect(
      new BoardPostsRepository().createPost({ title: 'Hello', body: 'World' }),
    ).resolves.toMatchObject({ id: POST_ID, author: null });
  });

  it('still fails when the insert itself fails', async () => {
    mockFrom.mockReturnValue(insertChain({ data: null, error: { message: 'boom' } }));

    await expect(
      new BoardPostsRepository().createPost({ title: 'Hello', body: 'World' }),
    ).rejects.toMatchObject({ code: 'DATABASE' });
  });
});

describe('BoardPostsRepository auth failures', () => {
  it.each(AUTH_SERVICE_FAILURES)(
    'reports %s as a failure, not as being signed out',
    async (_name, error) => {
      await expect(
        new BoardPostsRepository(clientWithAuthError(error)).createPost({
          title: 'Hello',
          body: 'World',
        }),
      ).rejects.toMatchObject({ code: 'DATABASE' });
    },
  );

  it.each(SIGNED_OUT_AUTH_ERRORS)('reports %s as UNAUTHENTICATED', async (_name, error) => {
    await expect(
      new BoardPostsRepository(clientWithAuthError(error)).createPost({
        title: 'Hello',
        body: 'World',
      }),
    ).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
  });
});
