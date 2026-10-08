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
