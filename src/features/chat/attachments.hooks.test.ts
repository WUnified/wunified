import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { act, renderHook } from '@testing-library/react-native';

import { MAX_PHOTOS_PER_MESSAGE, useMessageAttachments } from './attachments.hooks';
import { pickImage } from '../../lib/pickImage';

jest.mock('../../lib/pickImage', () => ({ pickImage: jest.fn() }));

const pick = jest.mocked(pickImage);
const picked = (name: string) => ({
  data: new ArrayBuffer(8),
  contentType: 'image/jpeg',
  previewUri: `file:///${name}.jpg`,
});

describe('useMessageAttachments', () => {
  beforeEach(() => {
    pick.mockReset();
  });

  it('adds picked photos and uploads only their bytes and type', async () => {
    pick.mockResolvedValueOnce(picked('a')).mockResolvedValueOnce(picked('b'));
    const { result } = renderHook(() => useMessageAttachments());

    await act(() => result.current.add());
    await act(() => result.current.add());

    expect(result.current.attachments.map((a) => a.previewUri)).toEqual([
      'file:///a.jpg',
      'file:///b.jpg',
    ]);
    expect(result.current.toUploads()).toEqual([
      { data: expect.any(ArrayBuffer), contentType: 'image/jpeg' },
      { data: expect.any(ArrayBuffer), contentType: 'image/jpeg' },
    ]);
  });

  it('ignores a cancelled pick and removes or clears photos', async () => {
    pick.mockResolvedValueOnce(null).mockResolvedValueOnce(picked('a'));
    const { result } = renderHook(() => useMessageAttachments());

    await act(() => result.current.add());
    expect(result.current.attachments).toHaveLength(0);

    await act(() => result.current.add());
    act(() => result.current.remove(result.current.attachments[0].key));
    expect(result.current.attachments).toHaveLength(0);
  });

  it('stops at the per-message limit', async () => {
    pick.mockImplementation(() => Promise.resolve(picked('x')));
    const { result } = renderHook(() => useMessageAttachments());

    for (let i = 0; i < MAX_PHOTOS_PER_MESSAGE + 2; i += 1) {
      await act(() => result.current.add());
    }

    expect(result.current.attachments).toHaveLength(MAX_PHOTOS_PER_MESSAGE);
    expect(result.current.canAdd).toBe(false);
    expect(pick).toHaveBeenCalledTimes(MAX_PHOTOS_PER_MESSAGE);
  });

  it('reports a photo that could not be read', async () => {
    pick.mockRejectedValueOnce(new Error('Unable to read the selected image.'));
    const { result } = renderHook(() => useMessageAttachments());

    await act(() => result.current.add());

    expect(result.current.error).toBe('Unable to read the selected image.');
  });
});
