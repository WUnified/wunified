import type { SupabaseClient } from '@supabase/supabase-js';

import {
  ClubsRepositoryError,
  defaultClubClient,
  getClubPage,
  mapClubError,
  requireClient,
  requireCurrentUserId,
  requireUuid,
  toClubPage,
  type ClubPage,
  type ClubPageOptions,
} from './club_shared';
import type { Database, Tables } from '../../types/database';

// Raw rows stay private to this adapter; callers receive camelCase DTOs.
export type ClubRow = Pick<
  Tables<'clubs'>,
  'id' | 'name' | 'description' | 'created_by' | 'created_at' | 'updated_at'
>;

export type ClubDto = {
  id: string;
  name: string;
  description: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

// 'member' covers any club the user belongs to (active); 'managed' narrows to
// clubs where they are an owner or admin.
export type ClubScope = 'all' | 'member' | 'managed';

export type ListClubsOptions = ClubPageOptions & {
  query?: string;
  scope?: ClubScope;
};

export type CreateClubInput = {
  name: string;
  description?: string | null;
};

export type UpdateClubInput = {
  name?: string;
  description?: string | null;
};

const CLUB_COLUMNS = 'id, name, description, created_by, created_at, updated_at';
const MAX_NAME_LENGTH = 100;
const MAX_DESCRIPTION_LENGTH = 1000;
const MAX_SEARCH_LENGTH = 100;

// LIKE treats %, _ and \ as wildcards or escapes; user text must match literally.
function escapeLikePattern(value: string): string {
  return value.replace(/[\\%_]/g, (character) => `\\${character}`);
}

function validateName(value: string): string {
  const name = value.trim();
  if (!name || name.length > MAX_NAME_LENGTH) {
    throw new ClubsRepositoryError(
      'VALIDATION',
      `A club name between 1 and ${MAX_NAME_LENGTH} characters is required.`,
    );
  }

  return name;
}

function validateDescription(value: string | null | undefined): string | null {
  const description = value?.trim() || null;
  if (description && description.length > MAX_DESCRIPTION_LENGTH) {
    throw new ClubsRepositoryError(
      'VALIDATION',
      `A club description can be at most ${MAX_DESCRIPTION_LENGTH} characters.`,
    );
  }

  return description;
}

export function mapClubRow(row: ClubRow): ClubDto {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class ClubsRepository {
  constructor(private readonly client: SupabaseClient<Database> | null = defaultClubClient) {}

  /**
   * Lists clubs alphabetically with offset paging, an optional name search, and
   * an optional membership scope.
   * @throws ClubsRepositoryError when signed out for a member/managed scope or the query fails.
   */
  async listClubs(options: ListClubsOptions = {}): Promise<ClubPage<ClubDto>> {
    const client = requireClient(this.client);
    const { page, pageSize, offset } = getClubPage(options);
    const scope = options.scope ?? 'all';
    const search = options.query?.trim().slice(0, MAX_SEARCH_LENGTH);

    // The inner embed turns the membership join into a filter, so only clubs
    // with a matching membership row are returned.
    const columns: string =
      scope === 'all' ? CLUB_COLUMNS : `${CLUB_COLUMNS}, club_memberships!inner(user_id)`;
    let request = client.from('clubs').select(columns);

    if (scope !== 'all') {
      const userId = await requireCurrentUserId(client, 'filter your clubs');
      request = request
        .eq('club_memberships.user_id', userId)
        .eq('club_memberships.status', 'active');
      if (scope === 'managed') {
        request = request.in('club_memberships.role', ['owner', 'admin']);
      }
    }

    if (search) {
      request = request.ilike('name', `%${escapeLikePattern(search)}%`);
    }

    // The id tiebreaker keeps offset pages stable when names collide.
    const { data, error } = await request
      .order('name', { ascending: true })
      .order('id', { ascending: true })
      .range(offset, offset + pageSize);

    if (error) {
      throw mapClubError('load clubs', error);
    }

    const rows = (data as unknown as ClubRow[]).map(mapClubRow);
    return toClubPage(rows, page, pageSize);
  }

  async getClub(clubId: string): Promise<ClubDto> {
    requireUuid(clubId, 'Club');
    const { data, error } = await requireClient(this.client)
      .from('clubs')
      .select(CLUB_COLUMNS)
      .eq('id', clubId)
      .maybeSingle();

    if (error) {
      throw mapClubError('load club', error);
    }

    if (!data) {
      throw new ClubsRepositoryError('NOT_FOUND', 'Club not found.');
    }

    return mapClubRow(data);
  }

  /**
   * Creates a club owned by the current user. The database trigger adds the
   * creator's owner membership, so this method does not insert one.
   */
  async createClub(input: CreateClubInput): Promise<ClubDto> {
    const name = validateName(input.name);
    const description = validateDescription(input.description);
    const userId = await requireCurrentUserId(this.client, 'create a club');

    const { data, error } = await requireClient(this.client)
      .from('clubs')
      .insert({ name, description, created_by: userId })
      .select(CLUB_COLUMNS)
      .single();

    if (error) {
      throw mapClubError('create club', error);
    }

    return mapClubRow(data);
  }

  async updateClub(clubId: string, input: UpdateClubInput): Promise<ClubDto> {
    requireUuid(clubId, 'Club');
    const patch: { name?: string; description?: string | null } = {};
    if (input.name !== undefined) patch.name = validateName(input.name);
    if (input.description !== undefined) patch.description = validateDescription(input.description);

    if (Object.keys(patch).length === 0) {
      throw new ClubsRepositoryError('VALIDATION', 'Provide at least one club field to update.');
    }

    const { data, error } = await requireClient(this.client)
      .from('clubs')
      .update(patch)
      .eq('id', clubId)
      .select(CLUB_COLUMNS)
      .maybeSingle();

    if (error) {
      throw mapClubError('update club', error);
    }

    // RLS hides rows the caller cannot update, so no row means missing or not an owner.
    if (!data) {
      throw new ClubsRepositoryError('NOT_FOUND', 'Club not found or you are not its owner.');
    }

    return mapClubRow(data);
  }

  async deleteClub(clubId: string): Promise<void> {
    requireUuid(clubId, 'Club');
    const { data, error } = await requireClient(this.client)
      .from('clubs')
      .delete()
      .eq('id', clubId)
      .select('id');

    if (error) {
      throw mapClubError('delete club', error);
    }

    if (data.length === 0) {
      throw new ClubsRepositoryError('NOT_FOUND', 'Club not found or you are not its owner.');
    }
  }
}

export const clubsRepository = new ClubsRepository();
