import type {
  ClubDto,
  ClubMembershipDto,
  ClubPage,
  ClubPageOptions,
  ClubScope,
  CreateClubInput,
  ImageUploadSource,
  ListClubMembersOptions,
  ManageableMemberRole,
  ManageableMemberStatus,
  MyClubMembershipDto,
  UpdateClubInput,
} from '../../lib/db';

export const CLUB_ROLES = ['owner', 'admin', 'member'] as const;
export const CLUB_MEMBERSHIP_STATUSES = ['pending', 'active', 'suspended'] as const;

export type ClubRole = (typeof CLUB_ROLES)[number];
export type ClubMembershipStatus = (typeof CLUB_MEMBERSHIP_STATUSES)[number];

// The database stores role and status as free text constrained by CHECKs; the
// feature narrows them to unions so UI code can switch exhaustively.
export type NarrowedMembership<T extends { role: string; status: string }> = Omit<
  T,
  'role' | 'status'
> & {
  role: ClubRole;
  status: ClubMembershipStatus;
};

export type Club = ClubDto;
export type ClubMembership = NarrowedMembership<ClubMembershipDto>;
export type MyClubMembership = NarrowedMembership<MyClubMembershipDto>;
export type ClubMember = NonNullable<ClubMembershipDto['member']>;
export type ClubPageResult<T> = ClubPage<T>;
export type ClubListOptions = ClubPageOptions & { query?: string; scope?: ClubScope };
export type ClubMembersOptions = Omit<ListClubMembersOptions, 'status'> & {
  status?: ClubMembershipStatus;
};
export type CreateClubValues = CreateClubInput;
export type UpdateClubValues = UpdateClubInput;
export type MemberRoleChange = ManageableMemberRole;
export type MemberStatusChange = ManageableMemberStatus;

export type UpdateClubVariables = { clubId: string; changes: UpdateClubValues };
export type ChangeClubImageVariables = {
  club: Club;
  kind: 'logo' | 'banner';
  source: ImageUploadSource;
};
export type ChangeMemberRoleVariables = { membershipId: string; role: MemberRoleChange };
export type ChangeMemberStatusVariables = { membershipId: string; status: MemberStatusChange };

export function isClubRole(value: string): value is ClubRole {
  return CLUB_ROLES.some((role) => role === value);
}

export function isClubMembershipStatus(value: string): value is ClubMembershipStatus {
  return CLUB_MEMBERSHIP_STATUSES.some((status) => status === value);
}
