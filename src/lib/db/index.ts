// The database barrel is the feature-facing persistence boundary. Individual
// features import repositories here rather than reaching into Supabase directly.
export { fetchChatMessages, type ChatMessage } from './chat';
export {
  fetchCurrentUserProfile,
  fetchProfileByUserId,
  upsertCurrentUserProfile,
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
