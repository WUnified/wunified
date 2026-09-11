import type { Json, Tables, TablesInsert } from '../../types/database';
import { supabase } from '../supabase';

// Raw row types remain private to this adapter. Public consumers receive mapped
// DTOs so schema column names and joined-row shapes do not leak upward.
type RawListingRow = Tables<'market_listings'>;
type RawPublicProfileRow = Tables<'public_profiles'>;
type RawListingWithSeller = RawListingRow & {
  public_profiles: RawPublicProfileRow | null;
};
type ListingInsert = Omit<TablesInsert<'market_listings'>, 'seller_id'>;

export type ListingSellerDto = {
  userId: string;
  username: string;
  displayName: string;
  avatar: string | null;
  wsuVerified: boolean;
};

export type ListingDto = {
  id: string;
  sellerId: string;
  title: string;
  description: string;
  category: string;
  price: number;
  condition: string | null;
  status: string;
  images: Json;
  createdAt: string;
  updatedAt: string;
  seller: ListingSellerDto;
};

export type CreateListingInput = {
  title: string;
  description: string;
  category: string;
  price: number;
  condition?: string | null;
};

export type ListingsRepositoryErrorCode =
  'CONFIGURATION' | 'UNAUTHENTICATED' | 'VALIDATION' | 'PERMISSION' | 'DATABASE' | 'NOT_FOUND';

export class ListingsRepositoryError extends Error {
  readonly code: ListingsRepositoryErrorCode;

  constructor(code: ListingsRepositoryErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ListingsRepositoryError';
    this.code = code;
  }
}

const LISTING_SELECT =
  // The explicit relationship name keeps this join stable after the seller
  // identity projection was separated from private profiles.
  'id, seller_id, title, description, category, price, condition, status, images, created_at, updated_at, public_profiles!market_listings_seller_id_public_profiles_fkey(user_id, username, display_name, avatar, wsu_verified)';

export class ListingsRepository {
  // Centralize configuration failure handling so every repository method fails
  // with the same actionable error when local or hosted env vars are missing.
  private getClient() {
    if (!supabase) {
      throw new ListingsRepositoryError('CONFIGURATION', 'Supabase is not configured.');
    }

    return supabase;
  }

  private mapListing(row: RawListingWithSeller): ListingDto {
    // A listing without its public identity is not useful to callers and usually
    // indicates inconsistent projection data, so fail instead of returning partial UI data.
    if (!row.public_profiles) {
      throw new ListingsRepositoryError('DATABASE', 'Listing seller profile is missing.');
    }

    return {
      id: row.id,
      sellerId: row.seller_id,
      title: row.title,
      description: row.description,
      category: row.category,
      price: row.price,
      condition: row.condition,
      status: row.status,
      images: row.images,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      seller: {
        userId: row.public_profiles.user_id,
        username: row.public_profiles.username,
        displayName: row.public_profiles.display_name,
        avatar: row.public_profiles.avatar,
        wsuVerified: row.public_profiles.wsu_verified,
      },
    };
  }

  private mapSupabaseError(
    operation: string,
    error: { code?: string; message: string },
  ): ListingsRepositoryError {
    if (error.code === '42501') {
      return new ListingsRepositoryError(
        'PERMISSION',
        `You do not have permission to ${operation}.`,
        { cause: error },
      );
    }

    if (error.code === '23503' || error.code === '23514' || error.code === '22P02') {
      return new ListingsRepositoryError(
        'VALIDATION',
        `The listing could not be ${operation} because its data is invalid.`,
        { cause: error },
      );
    }

    return new ListingsRepositoryError(
      'DATABASE',
      `Failed to ${operation} listing: ${error.message}`,
      { cause: error },
    );
  }

  /**
   * Loads active marketplace listings with their public seller details.
   * @returns Newest active listing DTOs first.
   * @throws ListingsRepositoryError when Supabase is unavailable or the query fails.
   */
  async listActive(): Promise<ListingDto[]> {
    const client = this.getClient();
    const { data, error } = await client
      .from('market_listings')
      .select(LISTING_SELECT)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      throw this.mapSupabaseError('load', error);
    }

    return (data as unknown as RawListingWithSeller[]).map((row) => this.mapListing(row));
  }

  /**
   * Creates a listing for the currently authenticated user.
   * @param input Listing fields supplied by the marketplace form; seller identity is ignored from caller input.
   * @returns The created listing with its seller DTO.
   * @throws ListingsRepositoryError when the user is signed out, input is invalid, or insertion fails.
   */
  async create(input: CreateListingInput): Promise<ListingDto> {
    const client = this.getClient();
    const title = input.title.trim();
    const description = input.description.trim();
    const category = input.category.trim();
    const condition = input.condition?.trim() || null;

    if (!title || !description || !category || !Number.isFinite(input.price) || input.price < 0) {
      throw new ListingsRepositoryError(
        'VALIDATION',
        'Title, description, category, and a non-negative price are required.',
      );
    }

    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser();

    if (userError) {
      throw this.mapSupabaseError('load the current user', userError);
    }

    if (!user) {
      throw new ListingsRepositoryError(
        'UNAUTHENTICATED',
        'You must be signed in to create a listing.',
      );
    }

    const insert: ListingInsert = {
      title,
      description,
      category,
      price: input.price,
      condition,
      status: 'active',
      images: [],
    };

    const { data, error } = await client
      .from('market_listings')
      .insert({ ...insert, seller_id: user.id })
      .select(LISTING_SELECT)
      .single();

    if (error) {
      throw this.mapSupabaseError('create', error);
    }

    return this.mapListing(data as unknown as RawListingWithSeller);
  }
}

export const listingsRepository = new ListingsRepository();
