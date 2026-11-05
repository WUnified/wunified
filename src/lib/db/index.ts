// The database barrel is the feature-facing persistence boundary. Individual
// features import repositories here rather than reaching into Supabase directly.
export {
  ChatRepository,
  ChatRepositoryError,
  chatRepository,
  type ChatConversationDto,
  type ChatMemberRole,
  type ChatMessageCursor,
  type ChatMessageDto,
  type ChatMessagePage,
  type ChatParticipantDto,
  type ChatRepositoryErrorCode,
  type ChatUserSearchResult,
  type ChatType,
  type CreateClubChatInput,
  type CreateDirectChatInput,
  type CreateGroupChatInput,
  type CreateMarketplaceChatInput,
  type ListChatMessagesOptions,
  type ListChatsOptions,
  type SendChatMessageInput,
} from './chat';
export {
  BoardPostsRepository,
  BoardPostsRepositoryError,
  boardPostsRepository,
  type BoardAuthorDto,
  type BoardCommentDto,
  type BoardPage,
  type BoardPageOptions,
  type BoardPostDto,
  type CreateBoardCommentInput,
  type CreateBoardPostInput,
  type BoardPostsRepositoryErrorCode,
} from './board_posts';
export {
  ClubsRepository,
  clubsRepository,
  type ClubDto,
  type ClubScope,
  type CreateClubInput,
  type ListClubsOptions,
  type UpdateClubInput,
} from './clubs';
export {
  ClubMembershipsRepository,
  clubMembershipsRepository,
  type ClubMemberDto,
  type ClubMembershipDto,
  type ListClubMembersOptions,
  type ManageableMemberRole,
  type ManageableMemberStatus,
  type MyClubMembershipDto,
} from './club_memberships';
export {
  ClubsRepositoryError,
  type ClubPage,
  type ClubPageOptions,
  type ClubsRepositoryErrorCode,
} from './club_shared';
export {
  fetchCurrentUserProfile,
  fetchProfileByUserId,
  updateCurrentUserProfile,
  type Profile,
} from './profiles';
export {
  ListingsRepository,
  ListingsRepositoryError,
  listingsRepository,
  type CreateListingInput,
  type ListingDto,
  type ListingSellerDto,
  type ListingsRepositoryErrorCode,
} from './listings';
export {
  EventsRepository,
  EventsRepositoryError,
  eventsRepository,
  type EventDto,
  type CreateEventInput,
  type EventRsvpStatus,
  type EventsRepositoryErrorCode,
  type MyEventRsvpDto,
} from './events';
