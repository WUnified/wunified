import { describe, expect, it } from '@jest/globals';

import {
  buildChatMediaPath,
  isRemoteImageUrl,
  parseImageRefs,
  requireRefsUnderPrefix,
} from './imagePaths';

const OWNER_ID = '10000000-0000-0000-0000-000000000001';
const OWNER_PREFIX = `${OWNER_ID}/`;

// These paths end up in rows other users render, so escaping the caller's own folder
// must be impossible even though storage RLS would also refuse the upload.
describe('image path safety', () => {
  it.each([
    ['a parent-folder segment', `${OWNER_PREFIX}../other-user/a.jpg`],
    ['an absolute path', `/${OWNER_PREFIX}a.jpg`],
    ["another user's folder", '10000000-0000-0000-0000-000000000002/a.jpg'],
  ])('refuses to persist %s', (_name, path) => {
    expect(() =>
      requireRefsUnderPrefix([{ path, contentType: 'image/jpeg' }], OWNER_PREFIX),
    ).toThrow('An attached image is not valid.');
  });

  it('refuses more images than the limit', () => {
    const refs = Array.from({ length: 6 }, (_, index) => ({
      path: `${OWNER_PREFIX}${index}.jpg`,
      contentType: 'image/jpeg' as const,
    }));

    expect(() => requireRefsUnderPrefix(refs, OWNER_PREFIX)).toThrow('Attach at most 5 images.');
  });

  it('drops malformed entries when reading stored refs, and keeps the rest', () => {
    expect(
      parseImageRefs([
        { path: 'a/b.jpg', contentType: 'image/jpeg' },
        { path: '../x.jpg', contentType: 'image/jpeg' },
        { path: '/x.jpg', contentType: 'image/jpeg' },
        { path: 'a/b.svg', contentType: 'image/svg+xml' },
        'https://cdn.example/x.jpg',
        null,
      ]),
    ).toEqual([{ path: 'a/b.jpg', contentType: 'image/jpeg' }]);
    expect(parseImageRefs('nope')).toEqual([]);
  });

  it('rejects a folder that is not an ID when building a path', () => {
    expect(() => buildChatMediaPath('../x', OWNER_ID, 'image/jpeg')).toThrow('valid ID');
  });
});

describe('isRemoteImageUrl', () => {
  it('accepts an https URL', () => {
    expect(isRemoteImageUrl('https://cdn.example/a.jpg')).toBe(true);
  });

  it.each(['http://cdn.example/a.jpg', 'javascript:alert(1)', 'user/a.jpg', ''])(
    'rejects %j',
    (value) => {
      expect(isRemoteImageUrl(value)).toBe(false);
    },
  );
});
