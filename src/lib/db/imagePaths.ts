// Pure helpers for image references: bucket names, storage paths, and parsing of
// the {path, contentType} entries stored in jsonb columns. Nothing here talks to
// Supabase, so it is safe to use from presentation code and unit tests.
//
// The folder layout is part of the security model: the storage RLS policies in
// supabase/migrations/ read the owner, chat, or club id from a fixed folder
// position. Always build paths with these helpers.

import { newUuid } from '../uuid';

export type StorageBucket =
  'avatars' | 'listing-images' | 'post-images' | 'club-images' | 'chat-media';
export type PublicStorageBucket = Exclude<StorageBucket, 'chat-media'>;

export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AllowedImageType = (typeof ALLOWED_IMAGE_TYPES)[number];

// Mirrors the bucket file_size_limit; checked client-side only for faster feedback.
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
// Mirrors the CHECK constraints on market_listings.images and board_posts.images.
export const MAX_IMAGES_PER_ENTITY = 5;

const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const REMOTE_URL_PATTERN = /^https:\/\/[^\s/]+(?:\/[^\s]*)?$/i;
const EXTENSION_BY_TYPE: Record<AllowedImageType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export type StorageRepositoryErrorCode =
  'CONFIGURATION' | 'UNAUTHENTICATED' | 'VALIDATION' | 'PERMISSION' | 'STORAGE';

export class StorageRepositoryError extends Error {
  readonly code: StorageRepositoryErrorCode;

  constructor(code: StorageRepositoryErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'StorageRepositoryError';
    this.code = code;
  }
}

export type UploadedImage = { path: string; contentType: AllowedImageType };
export type ImageRef = UploadedImage;

export function isAllowedImageType(value: string): value is AllowedImageType {
  return (ALLOWED_IMAGE_TYPES as readonly string[]).includes(value);
}

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function requireUuid(value: string, label: string): string {
  if (!isUuid(value)) {
    throw new StorageRepositoryError('VALIDATION', `${label} must be a valid ID.`);
  }
  return value.toLowerCase();
}

function newFileName(contentType: AllowedImageType): string {
  // Unique names make objects immutable-by-convention, so a replaced image never
  // serves stale content from a CDN or cache.
  return `${newUuid()}.${EXTENSION_BY_TYPE[contentType]}`;
}

export function buildAvatarPath(userId: string, contentType: AllowedImageType): string {
  return `${requireUuid(userId, 'User ID')}/${newFileName(contentType)}`;
}

// Listings and community posts share the same owner-then-entity layout.
export function buildOwnedEntityImagePath(
  userId: string,
  entityId: string,
  contentType: AllowedImageType,
): string {
  return `${requireUuid(userId, 'User ID')}/${requireUuid(entityId, 'Entity ID')}/${newFileName(contentType)}`;
}

export function buildClubImagePath(clubId: string, contentType: AllowedImageType): string {
  return `${requireUuid(clubId, 'Club ID')}/${newFileName(contentType)}`;
}

export function chatMediaPrefix(chatId: string, userId: string): string {
  return `${requireUuid(chatId, 'Chat ID')}/${requireUuid(userId, 'User ID')}/`;
}

export function buildChatMediaPath(
  chatId: string,
  userId: string,
  contentType: AllowedImageType,
): string {
  return `${chatMediaPrefix(chatId, userId)}${newFileName(contentType)}`;
}

// Legacy rows (and seed data) may hold absolute https URLs instead of paths.
export function isRemoteImageUrl(value: string): boolean {
  return REMOTE_URL_PATTERN.test(value.trim());
}

function isSafeObjectPath(path: string): boolean {
  return path.length > 0 && !path.startsWith('/') && !path.split('/').includes('..');
}

// Lenient on purpose: one malformed entry should not hide the rest of a feed.
// Write paths validate strictly instead.
export function parseImageRefs(value: unknown): ImageRef[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const refs: ImageRef[] = [];
  for (const item of value) {
    if (typeof item !== 'object' || item === null) continue;
    const { path, contentType } = item as Record<string, unknown>;
    if (
      typeof path === 'string' &&
      isSafeObjectPath(path) &&
      typeof contentType === 'string' &&
      isAllowedImageType(contentType)
    ) {
      refs.push({ path, contentType });
    }
  }

  return refs;
}

// Strict check for refs a caller is about to persist: every path must live under
// the given folder prefix, so a row can only reference the caller's own uploads.
export function requireRefsUnderPrefix(
  refs: readonly ImageRef[],
  prefix: string,
  max: number = MAX_IMAGES_PER_ENTITY,
): ImageRef[] {
  if (refs.length > max) {
    throw new StorageRepositoryError('VALIDATION', `Attach at most ${max} images.`);
  }

  for (const ref of refs) {
    if (
      !isSafeObjectPath(ref.path) ||
      !ref.path.startsWith(prefix) ||
      !isAllowedImageType(ref.contentType)
    ) {
      throw new StorageRepositoryError('VALIDATION', 'An attached image is not valid.');
    }
  }

  return refs.map(({ path, contentType }) => ({ path, contentType }));
}
