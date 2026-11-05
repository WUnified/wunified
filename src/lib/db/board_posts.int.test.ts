import { beforeAll, describe, expect, it } from '@jest/globals';

import { BoardPostsRepository } from './board_posts';
import {
  SEED,
  createAnonClient,
  signInAs,
  uniqueSuffix,
  type TestClient,
} from '../../test/integration/clients';

describe('BoardPostsRepository against the local stack', () => {
  let maya: TestClient;
  let jordan: TestClient;

  beforeAll(async () => {
    maya = await signInAs('maya');
    jordan = await signInAs('jordan');
  });

  describe('reading', () => {
    it('lets a signed-out visitor page through posts with public author identity', async () => {
      const repository = new BoardPostsRepository(createAnonClient());

      const firstPage = await repository.listPosts({ pageSize: 2 });

      expect(firstPage.items).toHaveLength(2);
      expect(firstPage).toMatchObject({ hasMore: true, nextPage: 1 });
      expect(firstPage.items[0]?.author?.username).toEqual(expect.any(String));
    });

    it('lists comments for a post oldest first', async () => {
      const { items } = await new BoardPostsRepository(createAnonClient()).listComments(
        SEED.boardPosts.mayaStudyGroup,
      );

      expect(items.length).toBeGreaterThanOrEqual(2);
      const timestamps = items.map((comment) => comment.createdAt);
      expect(timestamps).toEqual([...timestamps].sort());
    });
  });

  describe('comment paging', () => {
    it('pages comments in order and reports when more remain', async () => {
      const post = await new BoardPostsRepository(maya).createPost({
        title: `Integration paging ${uniqueSuffix()}`,
        body: 'Has three comments.',
      });
      const jordanRepository = new BoardPostsRepository(jordan);
      for (const body of ['first', 'second', 'third']) {
        await jordanRepository.createComment({ post_id: post.id, body });
      }

      const firstPage = await jordanRepository.listComments(post.id, { pageSize: 2 });
      const secondPage = await jordanRepository.listComments(post.id, {
        pageSize: 2,
        page: firstPage.nextPage ?? undefined,
      });

      expect(firstPage.items.map((comment) => comment.body)).toEqual(['first', 'second']);
      expect(firstPage.hasMore).toBe(true);
      expect(secondPage).toMatchObject({ hasMore: false, nextPage: null });
      expect(secondPage.items.map((comment) => comment.body)).toEqual(['third']);
    });
  });

  describe('writing', () => {
    it('creates a post and a comment attributed to the signed-in user', async () => {
      const title = `Integration post ${uniqueSuffix()}`;

      const post = await new BoardPostsRepository(maya).createPost({ title, body: 'Hello.' });
      const comment = await new BoardPostsRepository(jordan).createComment({
        post_id: post.id,
        body: 'Reply from Jordan.',
      });

      expect(post).toMatchObject({ title, authorId: SEED.users.maya.id });
      expect(comment).toMatchObject({ postId: post.id, authorId: SEED.users.jordan.id });
      expect(comment.author?.username).toBe('jordan_l');
    });

    it('rejects a signed-out user', async () => {
      await expect(
        new BoardPostsRepository(createAnonClient()).createPost({ title: 'Nope', body: 'Nope' }),
      ).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
    });

    it('maps a comment on a missing post to a VALIDATION error', async () => {
      await expect(
        new BoardPostsRepository(maya).createComment({
          post_id: '30000000-0000-0000-0000-00000000dead',
          body: 'Orphan comment',
        }),
      ).rejects.toMatchObject({ code: 'VALIDATION' });
    });
  });

  describe('row-level security', () => {
    it('blocks posting as another user', async () => {
      const { error } = await maya
        .from('board_posts')
        .insert({ title: 'Spoof', body: 'Spoof', author_id: SEED.users.jordan.id });

      expect(error?.code).toBe('42501');
    });

    it("silently skips edits and deletes of another user's post", async () => {
      const post = await new BoardPostsRepository(maya).createPost({
        title: `Integration post ${uniqueSuffix()}`,
        body: 'Original.',
      });

      const { data: updated } = await jordan
        .from('board_posts')
        .update({ body: 'Edited by Jordan' })
        .eq('id', post.id)
        .select('id');
      const { data: deleted } = await jordan
        .from('board_posts')
        .delete()
        .eq('id', post.id)
        .select('id');

      expect(updated).toEqual([]);
      expect(deleted).toEqual([]);
    });
  });
});
