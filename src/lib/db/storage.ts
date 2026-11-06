import type { SupabaseClient } from '@supabase/supabase-js';

import {
  MAX_IMAGE_BYTES,
  MAX_IMAGES_PER_ENTITY,
  StorageRepositoryError,
  buildAvatarPath,
  buildChatMediaPath,
  buildClubImagePath,
  buildOwnedEntityImagePath,
  isAllowedImageType,
  isRemoteImageUrl,
  parseImageRefs,
  type AllowedImageType,
  type PublicStorageBucket,
  type StorageBucket,
  type UploadedImage,
} from './imagePaths';
import type { Database } from '../../types/database';
import { supabase } from '../supabase';

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export type ImageUploadSource = {
  data: ArrayBuffer | Blob;
  contentType: string;
};

export class StorageRepository {
  constructor(private readonly client: SupabaseClient<Database> | null = supabase) {}

  private getClient(): SupabaseClient<Database> {
    if (!this.client) {
      throw new StorageRepositoryError('CONFIGURATION', 'Supabase is not configured.');
    }
    return this.client;
  }

  private async requireUserId(): Promise<string> {
    const {
      data: { user },
      error,
    } = await this.getClient().auth.getUser();
    if (error) {
      throw new StorageRepositoryError(
        'STORAGE',
        `Failed to load the current user: ${error.message}`,
        { cause: error },
      );
    }
    if (!user) {
      throw new StorageRepositoryError(
        'UNAUTHENTICATED',
        'You must be signed in to upload images.',
      );
    }
    return user.id;
  }

  private validate(source: ImageUploadSource): AllowedImageType {
    if (!isAllowedImageType(source.contentType)) {
      throw new StorageRepositoryError('VALIDATION', 'Images must be JPEG, PNG, or WebP.');
    }
    const size = source.data instanceof Blob ? source.data.size : source.data.byteLength;
    if (size === 0 || size > MAX_IMAGE_BYTES) {
      throw new StorageRepositoryError(
        'VALIDATION',
        'Images must be larger than 0 bytes and at most 5 MB.',
      );
    }
    return source.contentType;
  }

  private async upload(
    bucket: StorageBucket,
    path: string,
    source: ImageUploadSource,
    contentType: AllowedImageType,
  ): Promise<UploadedImage> {
    const { error } = await this.getClient()
      .storage.from(bucket)
      .upload(path, source.data, { contentType, upsert: false });

    if (error) {
      const status = (error as { statusCode?: string }).statusCode;
      if (status === '403' || status === '401') {
        throw new StorageRepositoryError(
          'PERMISSION',
          'You do not have permission to upload this image.',
          { cause: error },
        );
      }
      throw new StorageRepositoryError('STORAGE', `Failed to upload image: ${error.message}`, {
        cause: error,
      });
    }

    return { path, contentType };
  }

  private async uploadOne(
    bucket: StorageBucket,
    source: ImageUploadSource,
    buildPath: (contentType: AllowedImageType) => string,
  ): Promise<UploadedImage> {
    const contentType = this.validate(source);
    return this.upload(bucket, buildPath(contentType), source, contentType);
  }

  // All-or-nothing: validate everything first, and if an upload fails remove the
  // files already stored so a retry does not leave orphans behind.
  private async uploadMany(
    bucket: StorageBucket,
    sources: readonly ImageUploadSource[],
    buildPath: (contentType: AllowedImageType) => string,
  ): Promise<UploadedImage[]> {
    const maxImages = bucket === 'chat-media' ? 10 : MAX_IMAGES_PER_ENTITY;
    if (sources.length > maxImages) {
      throw new StorageRepositoryError('VALIDATION', `Attach at most ${maxImages} images.`);
    }
    const contentTypes = sources.map((source) => this.validate(source));

    const uploaded: UploadedImage[] = [];
    try {
      for (const [index, source] of sources.entries()) {
        const contentType = contentTypes[index];
        uploaded.push(await this.upload(bucket, buildPath(contentType), source, contentType));
      }
    } catch (error) {
      await this.remove(
        bucket,
        uploaded.map((image) => image.path),
      ).catch(() => undefined);
      throw error;
    }

    return uploaded;
  }

  /** Uploads the signed-in user's avatar and returns the path to store in `avatar`. */
  async uploadAvatar(source: ImageUploadSource): Promise<UploadedImage> {
    const userId = await this.requireUserId();
    return this.uploadOne('avatars', source, (type) => buildAvatarPath(userId, type));
  }

  /** Uploads images for a listing; the result belongs in `market_listings.images`. */
  async uploadListingImages(
    listingId: string,
    sources: readonly ImageUploadSource[],
  ): Promise<UploadedImage[]> {
    const userId = await this.requireUserId();
    return this.uploadMany('listing-images', sources, (type) =>
      buildOwnedEntityImagePath(userId, listingId, type),
    );
  }

  /** Uploads images for a community post; the result belongs in `board_posts.images`. */
  async uploadPostImages(
    postId: string,
    sources: readonly ImageUploadSource[],
  ): Promise<UploadedImage[]> {
    const userId = await this.requireUserId();
    return this.uploadMany('post-images', sources, (type) =>
      buildOwnedEntityImagePath(userId, postId, type),
    );
  }

  /** Uploads a club logo or banner. Storage RLS limits this to active club owners. */
  async uploadClubImage(clubId: string, source: ImageUploadSource): Promise<UploadedImage> {
    await this.requireUserId();
    return this.uploadOne('club-images', source, (type) => buildClubImagePath(clubId, type));
  }

  /** Uploads attachments for one chat message; the result belongs in `chat_messages.media`. */
  async uploadChatMedia(
    chatId: string,
    sources: readonly ImageUploadSource[],
  ): Promise<UploadedImage[]> {
    const userId = await this.requireUserId();
    return this.uploadMany('chat-media', sources, (type) =>
      buildChatMediaPath(chatId, userId, type),
    );
  }

  /** Public buckets only; chat media must use {@link createChatMediaUrl}. */
  getPublicUrl(bucket: PublicStorageBucket, path: string): string {
    return this.getClient().storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }

  /**
   * Turns a stored value into a displayable URL. Accepts legacy absolute https
   * URLs unchanged and returns null (instead of throwing) when Supabase is not
   * configured, so rendering never crashes on a missing env.
   */
  resolvePublicUrl(bucket: PublicStorageBucket, value: string | null | undefined): string | null {
    const candidate = value?.trim();
    if (!candidate) return null;
    if (isRemoteImageUrl(candidate)) return candidate;
    if (!this.client) return null;
    return this.getPublicUrl(bucket, candidate);
  }

  /** Resolves a jsonb image array that may mix {path} refs and legacy https strings. */
  resolvePublicUrls(bucket: PublicStorageBucket, value: unknown): string[] {
    if (!Array.isArray(value)) return [];

    const urls: string[] = [];
    for (const item of value) {
      const url =
        typeof item === 'string'
          ? isRemoteImageUrl(item)
            ? item.trim()
            : null
          : this.resolvePublicUrl(bucket, parseImageRefs([item])[0]?.path);
      if (url) urls.push(url);
    }
    return urls;
  }

  /** Chat media is private, so clients need a short-lived signed URL. */
  async createChatMediaUrl(path: string): Promise<string> {
    const { data, error } = await this.getClient()
      .storage.from('chat-media')
      .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

    if (error || !data) {
      throw new StorageRepositoryError(
        'STORAGE',
        `Failed to load chat media: ${error?.message ?? 'no URL returned'}`,
        { cause: error },
      );
    }
    return data.signedUrl;
  }

  /** Removes objects; storage RLS limits this to files the caller may delete. */
  async remove(bucket: StorageBucket, paths: string[]): Promise<void> {
    if (paths.length === 0) return;
    const { error } = await this.getClient().storage.from(bucket).remove(paths);
    if (error) {
      throw new StorageRepositoryError('STORAGE', `Failed to delete image: ${error.message}`, {
        cause: error,
      });
    }
  }
}

export const storageRepository = new StorageRepository();
export { StorageRepositoryError };
