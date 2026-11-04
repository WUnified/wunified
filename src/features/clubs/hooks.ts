import {
  approveJoinRequest,
  changeMemberRole,
  changeMemberStatus,
  createClub,
  deleteClub,
  leaveClub,
  loadClub,
  loadClubMembers,
  loadClubs,
  loadMyMemberships,
  rejectJoinRequest,
  removeClubMember,
  requestToJoinClub,
  updateClub,
} from './api';
import type { ClubListOptions, ClubMembersOptions } from './types';
import { useClubMutation } from './useClubMutation';
import { useClubPagedList } from './useClubPagedList';
import { useClubResource } from './useClubResource';

// Options are part of the reset key so a new search or filter restarts paging
// at page 0 instead of appending to the previous result set.
export function useClubs(options: Omit<ClubListOptions, 'page'> = {}) {
  const { query, scope, pageSize } = options;
  return useClubPagedList(
    (page) => loadClubs({ query, scope, pageSize, page }),
    JSON.stringify([query ?? '', scope ?? 'all', pageSize ?? null]),
    'Unable to load clubs.',
  );
}

export function useClub(clubId: string) {
  return useClubResource(() => loadClub(clubId), clubId, 'Unable to load club.');
}

export function useMyClubMemberships() {
  return useClubResource(loadMyMemberships, 'mine', 'Unable to load your clubs.');
}

// Only active owners and admins receive other users' rows; everyone else sees
// at most their own membership.
export function useClubMembers(clubId: string, options: Omit<ClubMembersOptions, 'page'> = {}) {
  const { status, pageSize } = options;
  return useClubPagedList(
    (page) => loadClubMembers(clubId, { status, pageSize, page }),
    JSON.stringify([clubId, status ?? null, pageSize ?? null]),
    'Unable to load club members.',
  );
}

export function useCreateClub() {
  return useClubMutation(createClub, 'Unable to create club.');
}

export function useUpdateClub() {
  return useClubMutation(updateClub, 'Unable to update club.');
}

export function useDeleteClub() {
  return useClubMutation(deleteClub, 'Unable to delete club.');
}

export function useRequestToJoinClub() {
  return useClubMutation(requestToJoinClub, 'Unable to request to join club.');
}

export function useLeaveClub() {
  return useClubMutation(leaveClub, 'Unable to leave club.');
}

export function useApproveJoinRequest() {
  return useClubMutation(approveJoinRequest, 'Unable to approve join request.');
}

export function useRejectJoinRequest() {
  return useClubMutation(rejectJoinRequest, 'Unable to reject join request.');
}

export function useChangeMemberRole() {
  return useClubMutation(changeMemberRole, 'Unable to change member role.');
}

export function useChangeMemberStatus() {
  return useClubMutation(changeMemberStatus, 'Unable to change member status.');
}

export function useRemoveClubMember() {
  return useClubMutation(removeClubMember, 'Unable to remove club member.');
}
