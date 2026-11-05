import * as ImagePicker from 'expo-image-picker';

import type { ImageUploadSource } from './db';

export type PickedImage = ImageUploadSource & {
  /** Local URI for showing a thumbnail before upload. */
  previewUri: string;
};

// Wraps expo-image-picker so features get an upload-ready source and never touch
// device APIs directly. Returns null when the user cancels.
export async function pickImage(): Promise<PickedImage | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    // Compression keeps typical photos under the 5 MB bucket limit.
    quality: 0.8,
  });

  if (result.canceled || result.assets.length === 0) {
    return null;
  }

  const asset = result.assets[0];
  const response = await fetch(asset.uri);
  if (!response.ok) {
    throw new Error('Unable to read the selected image.');
  }

  return {
    data: await response.arrayBuffer(),
    contentType: asset.mimeType ?? 'image/jpeg',
    previewUri: asset.uri,
  };
}
