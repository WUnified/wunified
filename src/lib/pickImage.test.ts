import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { launchImageLibraryAsync } from 'expo-image-picker';

import { pickImage } from './pickImage';

jest.mock('expo-image-picker', () => ({ launchImageLibraryAsync: jest.fn() }));

const launch = jest.mocked(launchImageLibraryAsync);

function pickerResult(asset: { uri: string; mimeType?: string }) {
  return { canceled: false, assets: [asset] } as unknown as Awaited<
    ReturnType<typeof launchImageLibraryAsync>
  >;
}

describe('pickImage', () => {
  const realFetch = globalThis.fetch;
  const bytes = new ArrayBuffer(4);
  const fetchImage = jest.fn<() => Promise<Response>>();

  beforeEach(() => {
    jest.resetAllMocks();
    globalThis.fetch = fetchImage;
    fetchImage.mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(bytes),
    } as unknown as Response);
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  it('returns null when the user cancels', async () => {
    launch.mockResolvedValue({ canceled: true, assets: null });

    await expect(pickImage()).resolves.toBeNull();

    expect(fetchImage).not.toHaveBeenCalled();
  });

  it('returns upload-ready bytes with the type and a preview URI', async () => {
    launch.mockResolvedValue(pickerResult({ uri: 'file:///a.png', mimeType: 'image/png' }));

    await expect(pickImage()).resolves.toEqual({
      data: bytes,
      contentType: 'image/png',
      previewUri: 'file:///a.png',
    });
  });

  it('assumes JPEG when the picker reports no type', async () => {
    launch.mockResolvedValue(pickerResult({ uri: 'file:///a' }));

    await expect(pickImage()).resolves.toMatchObject({ contentType: 'image/jpeg' });
  });

  it('fails clearly when the selected file cannot be read', async () => {
    launch.mockResolvedValue(pickerResult({ uri: 'file:///missing.jpg' }));
    fetchImage.mockResolvedValue({ ok: false } as unknown as Response);

    await expect(pickImage()).rejects.toThrow('Unable to read the selected image.');
  });
});
