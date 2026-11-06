import type { SupabaseClient } from '@supabase/supabase-js';

import { isSignedOutAuthError } from './authErrors';
import type { Database } from '../../types/database';
import { supabase } from '../supabase';

export type ClubsRepositoryErrorCode =
  'CONFIGURATION' | 'UNAUTHENTICATED' | 'VALIDATION' | 'PERMISSION' | 'DATABASE' | 'NOT_FOUND';

export class ClubsRepositoryError extends Error {
  readonly code: ClubsRepositoryErrorCode;

  constructor(code: ClubsRepositoryErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ClubsRepositoryError';
    this.code = code;
  }
}

export type ClubPageOptions = {
  page?: number;
  pageSize?: number;
};

export type ClubPage<T> = {
  items: T[];
  hasMore: boolean;
  // Null means the extra-row check found no next page.
  nextPage: number | null;
};

export const CLUB_MEMBERSHIP_STATUSES = ['pending', 'active', 'suspended'] as const;

const UUID_PATTERN = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export function requireUuid(value: string, label: string): void {
  if (!UUID_PATTERN.test(value)) {
    throw new ClubsRepositoryError('VALIDATION', `${label} must be a valid ID.`);
  }
}

// Fetch one extra row to determine hasMore without a separate count query.
export function getClubPage(options: ClubPageOptions) {
  const page = options.page ?? 0;
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;
  const offset = page * pageSize;

  if (
    !Number.isSafeInteger(page) ||
    page < 0 ||
    !Number.isSafeInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > MAX_PAGE_SIZE ||
    !Number.isSafeInteger(offset)
  ) {
    throw new ClubsRepositoryError(
      'VALIDATION',
      `Page must be a non-negative integer and page size must be between 1 and ${MAX_PAGE_SIZE}.`,
    );
  }

  return { page, pageSize, offset };
}

export function toClubPage<T>(rows: T[], page: number, pageSize: number): ClubPage<T> {
  const hasMore = rows.length > pageSize;
  return {
    items: hasMore ? rows.slice(0, pageSize) : rows,
    hasMore,
    nextPage: hasMore ? page + 1 : null,
  };
}

export function requireClient(client: SupabaseClient<Database> | null): SupabaseClient<Database> {
  if (!client) {
    throw new ClubsRepositoryError('CONFIGURATION', 'Supabase is not configured.');
  }

  return client;
}

export async function requireCurrentUserId(
  client: SupabaseClient<Database> | null,
  action: string,
): Promise<string> {
  const { data, error } = await requireClient(client).auth.getUser();

  if (error && !isSignedOutAuthError(error)) {
    throw mapClubError('load the current user', error);
  }

  if (error || !data.user) {
    throw new ClubsRepositoryError(
      'UNAUTHENTICATED',
      `You must be signed in to ${action}.`,
      error ? { cause: error } : undefined,
    );
  }

  return data.user.id;
}

// Trigger-raised errors (last owner, owner-only changes) carry user-readable
// messages, so validation failures pass the database message through.
export function mapClubError(
  operation: string,
  error: { code?: string; message: string },
): ClubsRepositoryError {
  if (error.code === '28000') {
    return new ClubsRepositoryError('UNAUTHENTICATED', `You must be signed in to ${operation}.`, {
      cause: error,
    });
  }

  if (error.code === 'P0002') {
    return new ClubsRepositoryError('NOT_FOUND', error.message, { cause: error });
  }

  if (error.code === '42501') {
    return new ClubsRepositoryError('PERMISSION', `You do not have permission to ${operation}.`, {
      cause: error,
    });
  }

  if (
    error.code === '23503' ||
    error.code === '23505' ||
    error.code === '23514' ||
    error.code === '22P02'
  ) {
    return new ClubsRepositoryError('VALIDATION', `Unable to ${operation}: ${error.message}`, {
      cause: error,
    });
  }

  return new ClubsRepositoryError('DATABASE', `Failed to ${operation}: ${error.message}`, {
    cause: error,
  });
}

export const defaultClubClient = supabase;
