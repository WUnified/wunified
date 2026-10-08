// The database barrel is the feature-facing persistence boundary. Individual
// features import repositories here rather than reaching into Supabase directly.
export { fetchChatMessages, type ChatMessage } from './chat';
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
