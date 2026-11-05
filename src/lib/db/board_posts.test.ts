import { describe, expect, it } from '@jest/globals';

import { BoardPostsRepository } from './board_posts';

describe('BoardPostsRepository post image validation', () => {
  const repository = new BoardPostsRepository();
  const base = { title: 'Lost keys', body: 'Found near Ablah Library.' };

  it('rejects non-HTTPS image URLs before contacting Supabase', async () => {
    await expect(
      repository.createPost({ ...base, images: ['http://example.com/keys.jpg'] }),
    ).rejects.toMatchObject({ name: 'BoardPostsRepositoryError', code: 'VALIDATION' });
  });

  it('rejects more than four images, matching the database constraint', async () => {
    const images = Array.from({ length: 5 }, (_, index) => `https://cdn.example/${index}.jpg`);
    await expect(repository.createPost({ ...base, images })).rejects.toMatchObject({
      code: 'VALIDATION',
    });
  });
});
