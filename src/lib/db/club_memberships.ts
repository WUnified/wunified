import type { SupabaseClient } from '@supabase/supabase-js';

import {
  CLUB_MEMBERSHIP_STATUSES,
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
import { mapClubRow, type ClubDto, type ClubRow } from './clubs';
import type { Database, Tables } from '../../types/database';

type MembershipRow = Pick<
  Tables<'club_memberships'>,
  'id' | 'club_id' | 'user_id' | 'role' | 'status' | 'created_at' | 'updated_at'
>;
type MembershipWithClubRow = MembershipRow & { clubs: ClubRow | null };
type PublicProfileRow = Pick<
  Tables<'public_profiles'>,
  'user_id' | 'username' | 'display_name' | 'avatar' | 'wsu_verified'
>;

export type ClubMemberDto = {
  userId: string;
  username: string;
  displayName: string;
  avatar: string | null;
  wsuVerified: boolean;
};

export type ClubMembershipDto = {
  id: string;
  clubId: string;
  userId: string;
  role: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  // Null when the public identity row is unavailable; the membership is still valid.
  member: ClubMemberDto | null;
};

export type MyClubMembershipDto = Omit<ClubMembershipDto, 'member'> & { club: ClubDto };

export type ListClubMembersOptions = ClubPageOptions & {
  status?: string;
};

export type ManageableMemberRole = 'owner' | 'admin' | 'member';
export type ManageableMemberStatus = 'active' | 'suspended';

const MEMBERSHIP_COLUMNS = 'id, club_id, user_id, role, status, created_at, updated_at';
const CLUB_COLUMNS = 'id, name, description, created_by, created_at, updated_at';
const MEMBER_COLUMNS = 'user_id, username, display_name, avatar, wsu_verified';

function mapMembershipBase(row: MembershipRow) {
  return {
    id: row.id,
    clubId: row.club_id,
    userId: row.user_id,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function requireOneOf(value: string, allowed: readonly string[], label: string): void {
  if (!allowed.includes(value)) {
    throw new ClubsRepositoryError('VALIDATION', `${label} must be one of: ${allowed.join(', ')}.`);
  }
}

export class ClubMembershipsRepository {
  constructor(private readonly client: SupabaseClient<Database> | null = defaultClubClient) {}

  private async getMembers(userIds: string[]): Promise<Map<string, ClubMemberDto>> {
    if (userIds.length === 0) return new Map();

    const { data, error } = await requireClient(this.client)
      .from('public_profiles')
      .select(MEMBER_COLUMNS)
      .in('user_id', userIds);

    if (error) {
      throw mapClubError('load club members', error);
    }

    return new Map(
      (data as PublicProfileRow[]).map((profile) => [
        profile.user_id,
        {
          userId: profile.user_id,
          username: profile.username,
          displayName: profile.display_name,
          avatar: profile.avatar,
          wsuVerified: profile.wsu_verified,
        },
      ]),
    );
  }

  /**
   * Lists the current user's memberships, including pending requests, with the
   * club each one belongs to. Newest first.
   */
  async listMyMemberships(): Promise<MyClubMembershipDto[]> {
    const userId = await requireCurrentUserId(this.client, 'view your clubs');
    const { data, error } = await requireClient(this.client)
      .from('club_memberships')
      .select(`${MEMBERSHIP_COLUMNS}, clubs!club_memberships_club_id_fkey(${CLUB_COLUMNS})`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false });

    if (error) {
      throw mapClubError('load your clubs', error);
    }

    return (data as unknown as MembershipWithClubRow[]).map((row) => {
      if (!row.clubs) {
        throw new ClubsRepositoryError('DATABASE', 'Club membership is missing its club.');
      }

      return { ...mapMembershipBase(row), club: mapClubRow(row.clubs) };
    });
  }

  /**
   * Lists a club's memberships, oldest first. Row-level security only returns
   * other users' rows to active owners and admins; anyone else sees their own.
   * Pass status 'pending' for the approval queue.
   */
  async listClubMembers(
    clubId: string,
    options: ListClubMembersOptions = {},
  ): Promise<ClubPage<ClubMembershipDto>> {
    requireUuid(clubId, 'Club');
    const { page, pageSize, offset } = getClubPage(options);

    let request = requireClient(this.client)
      .from('club_memberships')
      .select(MEMBERSHIP_COLUMNS)
      .eq('club_id', clubId);

    if (options.status !== undefined) {
      requireOneOf(options.status, CLUB_MEMBERSHIP_STATUSES, 'Status');
      request = request.eq('status', options.status);
    }

    const { data, error } = await request
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .range(offset, offset + pageSize);

    if (error) {
      throw mapClubError('load club members', error);
    }

    const result = toClubPage(data as MembershipRow[], page, pageSize);
    const members = await this.getMembers(result.items.map((row) => row.user_id));

    return {
      ...result,
      items: result.items.map((row) => ({
        ...mapMembershipBase(row),
        member: members.get(row.user_id) ?? null,
      })),
    };
  }

  /**
   * Files a join request for the current user. The membership starts as a
   * pending 'member'; an owner or admin must approve it.
   */
  async requestToJoin(clubId: string): Promise<ClubMembershipDto> {
    requireUuid(clubId, 'Club');
    const userId = await requireCurrentUserId(this.client, 'request to join a club');

    const { data, error } = await requireClient(this.client)
      .from('club_memberships')
      .insert({ club_id: clubId, user_id: userId, role: 'member', status: 'pending' })
      .select(MEMBERSHIP_COLUMNS)
      .single();

    if (error) {
      // A unique violation means a membership or request already exists.
      throw error.code === '23505'
        ? new ClubsRepositoryError(
            'VALIDATION',
            'You already belong to this club or have a pending request.',
            { cause: error },
          )
        : mapClubError('request to join club', error);
    }

    return { ...mapMembershipBase(data), member: null };
  }

  private async updateMembership(
    membershipId: string,
    patch: { role?: string; status?: string },
    operation: string,
    requirePending = false,
  ): Promise<ClubMembershipDto> {
    requireUuid(membershipId, 'Membership');
    let request = requireClient(this.client)
      .from('club_memberships')
      .update(patch)
      .eq('id', membershipId);

    // Approval must not silently reactivate a suspended member.
    if (requirePending) {
      request = request.eq('status', 'pending');
    }

    const { data, error } = await request.select(MEMBERSHIP_COLUMNS).maybeSingle();

    if (error) {
      throw mapClubError(operation, error);
    }

    if (!data) {
      throw new ClubsRepositoryError(
        'NOT_FOUND',
        'Membership not found, or you are not allowed to manage it.',
      );
    }

    return { ...mapMembershipBase(data), member: null };
  }

  /** Approves a pending join request. Owners and admins only (enforced by RLS). */
  approveRequest(membershipId: string): Promise<ClubMembershipDto> {
    return this.updateMembership(membershipId, { status: 'active' }, 'approve join request', true);
  }

  async updateMemberRole(
    membershipId: string,
    role: ManageableMemberRole,
  ): Promise<ClubMembershipDto> {
    requireOneOf(role, ['owner', 'admin', 'member'], 'Role');
    return this.updateMembership(membershipId, { role }, 'change member role');
  }

  async updateMemberStatus(
    membershipId: string,
    status: ManageableMemberStatus,
  ): Promise<ClubMembershipDto> {
    requireOneOf(status, ['active', 'suspended'], 'Status');
    return this.updateMembership(membershipId, { status }, 'change member status');
  }

  private async deleteMembership(
    membershipId: string,
    operation: string,
    pendingOnly: boolean,
  ): Promise<void> {
    requireUuid(membershipId, 'Membership');
    let request = requireClient(this.client)
      .from('club_memberships')
      .delete()
      .eq('id', membershipId);
    if (pendingOnly) {
      request = request.eq('status', 'pending');
    }

    const { data, error } = await request.select('id');

    if (error) {
      throw mapClubError(operation, error);
    }

    if (data.length === 0) {
      throw new ClubsRepositoryError(
        'NOT_FOUND',
        pendingOnly
          ? 'Pending join request not found, or you are not allowed to reject it.'
          : 'Membership not found, or you are not allowed to remove it.',
      );
    }
  }

  /** Deletes only a request that is still pending. */
  rejectRequest(membershipId: string): Promise<void> {
    return this.deleteMembership(membershipId, 'reject join request', true);
  }

  /** Removes a member or request regardless of its status. */
  removeMembership(membershipId: string): Promise<void> {
    return this.deleteMembership(membershipId, 'remove club member', false);
  }

  /**
   * Removes the current user's membership. Also cancels their own pending
   * request. The database deletes the club if this was its last active owner.
   */
  async leaveClub(clubId: string): Promise<void> {
    requireUuid(clubId, 'Club');
    const userId = await requireCurrentUserId(this.client, 'leave a club');
    const { data, error } = await requireClient(this.client)
      .from('club_memberships')
      .delete()
      .eq('club_id', clubId)
      .eq('user_id', userId)
      .select('id');

    if (error) {
      throw mapClubError('leave club', error);
    }

    if (data.length === 0) {
      throw new ClubsRepositoryError('NOT_FOUND', 'You are not a member of this club.');
    }
  }
}

export const clubMembershipsRepository = new ClubMembershipsRepository();
