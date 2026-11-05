import type {
  ChangeMemberRoleVariables,
  ChangeMemberStatusVariables,
  Club,
  ClubListOptions,
  ClubMembersOptions,
  ClubMembership,
  ClubPageResult,
  CreateClubValues,
  MyClubMembership,
  NarrowedMembership,
  UpdateClubVariables,
} from './types';
import { isClubMembershipStatus, isClubRole } from './types';
import { clubMembershipsRepository, clubsRepository } from '../../lib/db';

function narrowMembership<T extends { role: string; status: string }>(
  membership: T,
): NarrowedMembership<T> {
  const { role, status } = membership;
  if (!isClubRole(role)) {
    throw new Error(`Unsupported club role received: ${role}`);
  }
  if (!isClubMembershipStatus(status)) {
    throw new Error(`Unsupported club membership status received: ${status}`);
  }

  return { ...membership, role, status };
}

// Adds operation-specific context at the feature boundary while the repository
// remains the only owner of Supabase queries.
async function run<T>(action: string, operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    const message = error instanceof Error ? error.message : `Unable to ${action}.`;
    throw new Error(`Failed to ${action}: ${message}`, { cause: error });
  }
}

export function loadClubs(options: ClubListOptions = {}): Promise<ClubPageResult<Club>> {
  return run('load clubs', () => clubsRepository.listClubs(options));
}

export function loadClub(clubId: string): Promise<Club> {
  return run('load club', () => clubsRepository.getClub(clubId));
}

export function createClub(input: CreateClubValues): Promise<Club> {
  return run('create club', () => clubsRepository.createClub(input));
}

export function updateClub({ clubId, changes }: UpdateClubVariables): Promise<Club> {
  return run('update club', () => clubsRepository.updateClub(clubId, changes));
}

export function deleteClub(clubId: string): Promise<void> {
  return run('delete club', () => clubsRepository.deleteClub(clubId));
}

export function loadMyMemberships(): Promise<MyClubMembership[]> {
  return run('load your clubs', async () =>
    (await clubMembershipsRepository.listMyMemberships()).map(narrowMembership),
  );
}

export function loadClubMembers(
  clubId: string,
  options: ClubMembersOptions = {},
): Promise<ClubPageResult<ClubMembership>> {
  return run('load club members', async () => {
    const page = await clubMembershipsRepository.listClubMembers(clubId, options);
    return { ...page, items: page.items.map(narrowMembership) };
  });
}

export function requestToJoinClub(clubId: string): Promise<ClubMembership> {
  return run('request to join club', async () =>
    narrowMembership(await clubMembershipsRepository.requestToJoin(clubId)),
  );
}

export function approveJoinRequest(membershipId: string): Promise<ClubMembership> {
  return run('approve join request', async () =>
    narrowMembership(await clubMembershipsRepository.approveRequest(membershipId)),
  );
}

export function rejectJoinRequest(membershipId: string): Promise<void> {
  return run('reject join request', () => clubMembershipsRepository.rejectRequest(membershipId));
}

export function changeMemberRole({
  membershipId,
  role,
}: ChangeMemberRoleVariables): Promise<ClubMembership> {
  return run('change member role', async () =>
    narrowMembership(await clubMembershipsRepository.updateMemberRole(membershipId, role)),
  );
}

export function changeMemberStatus({
  membershipId,
  status,
}: ChangeMemberStatusVariables): Promise<ClubMembership> {
  return run('change member status', async () =>
    narrowMembership(await clubMembershipsRepository.updateMemberStatus(membershipId, status)),
  );
}

export function removeClubMember(membershipId: string): Promise<void> {
  return run('remove club member', () => clubMembershipsRepository.removeMembership(membershipId));
}

// Leaving as the last active owner deletes the club in the database.
export function leaveClub(clubId: string): Promise<void> {
  return run('leave club', () => clubMembershipsRepository.leaveClub(clubId));
}
