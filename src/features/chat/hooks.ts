import { useEffect, useRef, useState } from 'react';

import {
  createClubChat,
  createDirectChat,
  createGroupChat,
  createMarketplaceChat,
  inviteMember,
  leaveChat,
  loadChats,
  loadMessages,
  markChatRead,
  removeMember,
  searchChatUsers,
  sendMessage,
  sendMessageWithImages,
  setMemberRole,
} from './api';
import { useChatMessageSubscription } from './realtime';
import type {
  ChatConversation,
  ChatListOptions,
  ChatMessage,
  CreateClubChatInput,
  CreateDirectChatInput,
  CreateGroupChatInput,
  CreateMarketplaceChatInput,
  MessageCursor,
  SendChatMessageInput,
  SearchableChatUser,
} from './types';
import type { ImageUploadSource } from '../../lib/db';

const LIVE_REFRESH_DEBOUNCE_MS = 400;

// Realtime can deliver a message the page load already returned, and edits replace in place.
function upsertMessage(list: ChatMessage[], message: ChatMessage): ChatMessage[] {
  const index = list.findIndex((existing) => existing.id === message.id);
  if (index === -1) return [...list, message];
  const next = list.slice();
  next[index] = message;
  return next;
}

export function useChatUserSearch(query: string) {
  const normalizedQuery = query.trim();
  const [results, setResults] = useState<SearchableChatUser[]>([]);
  const [resultsForQuery, setResultsForQuery] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorForQuery, setErrorForQuery] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (normalizedQuery.length < 2) return;

    let active = true;
    const requestId = ++requestIdRef.current;
    const timeoutId = setTimeout(() => {
      setErrorForQuery(null);
      void searchChatUsers(normalizedQuery)
        .then((nextResults) => {
          if (!active || requestId !== requestIdRef.current) return;
          setResults(nextResults);
          setResultsForQuery(normalizedQuery);
          setError(null);
        })
        .catch((caught: unknown) => {
          if (!active || requestId !== requestIdRef.current) return;
          setError(caught instanceof Error ? caught.message : 'Unable to search users.');
          setErrorForQuery(normalizedQuery);
        });
    }, 250);

    return () => {
      active = false;
      clearTimeout(timeoutId);
      if (requestId === requestIdRef.current) requestIdRef.current += 1;
    };
  }, [normalizedQuery]);

  return {
    results: normalizedQuery.length >= 2 && resultsForQuery === normalizedQuery ? results : [],
    loading:
      normalizedQuery.length >= 2 &&
      resultsForQuery !== normalizedQuery &&
      errorForQuery !== normalizedQuery,
    error: errorForQuery === normalizedQuery ? error : null,
    canSearch: normalizedQuery.length >= 2,
  };
}

export function useChatList(options: ChatListOptions = {}) {
  const chatType = options.type;
  const [listState, setListState] = useState<{
    initialized: boolean;
    type: ChatListOptions['type'];
    chats: ChatConversation[];
    loaded: boolean;
    loading: boolean;
    error: string | null;
  }>({
    initialized: false,
    type: undefined,
    chats: [],
    loaded: false,
    loading: true,
    error: null,
  });
  const requestIdRef = useRef(0);
  const mountedRef = useRef(true);
  const stateMatchesType = listState.initialized && listState.type === chatType;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, []);

  async function reload() {
    const requestId = ++requestIdRef.current;
    setListState((current) => ({
      initialized: true,
      type: chatType,
      chats: stateMatchesType ? current.chats : [],
      loaded: stateMatchesType && current.loaded,
      loading: true,
      error: null,
    }));
    try {
      const nextChats = await loadChats({ type: chatType });
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      setListState({
        initialized: true,
        type: chatType,
        chats: nextChats,
        loaded: true,
        loading: false,
        error: null,
      });
    } catch (caught: unknown) {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setListState((current) => ({
          initialized: true,
          type: chatType,
          chats: stateMatchesType ? current.chats : [],
          loaded: stateMatchesType && current.loaded,
          loading: false,
          error: caught instanceof Error ? caught.message : 'Unable to load chats.',
        }));
      }
    }
  }

  useEffect(() => {
    let active = true;
    const requestId = ++requestIdRef.current;
    void loadChats({ type: chatType })
      .then((nextChats) => {
        if (!active || !mountedRef.current || requestId !== requestIdRef.current) return;
        setListState({
          initialized: true,
          type: chatType,
          chats: nextChats,
          loaded: true,
          loading: false,
          error: null,
        });
      })
      .catch((caught: unknown) => {
        if (active && mountedRef.current && requestId === requestIdRef.current) {
          setListState({
            initialized: true,
            type: chatType,
            chats: [],
            loaded: false,
            loading: false,
            error: caught instanceof Error ? caught.message : 'Unable to load chats.',
          });
        }
      });
    return () => {
      active = false;
      if (requestId === requestIdRef.current) requestIdRef.current += 1;
    };
  }, [chatType]);

  // Silent refetch for live updates: no loading flash, and it claims the request token
  // so an older in-flight load cannot overwrite the fresher result.
  function refreshQuietly() {
    const requestId = ++requestIdRef.current;
    void loadChats({ type: chatType })
      .then((nextChats) => {
        if (!mountedRef.current || requestId !== requestIdRef.current) return;
        setListState({
          initialized: true,
          type: chatType,
          chats: nextChats,
          loaded: true,
          loading: false,
          error: null,
        });
      })
      .catch(() => {
        // Keep showing the previous list; a stale preview is not worth an error state.
        if (!mountedRef.current || requestId !== requestIdRef.current) return;
        setListState((current) => ({ ...current, loading: false }));
      });
  }

  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  function scheduleRefresh() {
    // A burst of messages triggers one refetch, not one per message.
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    refreshTimerRef.current = setTimeout(() => {
      refreshTimerRef.current = null;
      refreshQuietly();
    }, LIVE_REFRESH_DEBOUNCE_MS);
  }
  useEffect(
    () => () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    },
    [],
  );

  useChatMessageSubscription({
    enabled: stateMatchesType,
    onMessage: scheduleRefresh,
    onResync: refreshQuietly,
  });

  return {
    chats: stateMatchesType ? listState.chats : [],
    loading: !stateMatchesType || listState.loading,
    loaded: stateMatchesType && listState.loaded,
    error: stateMatchesType ? listState.error : null,
    reload,
  };
}

export function useChatMessages(chatId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadedChatId, setLoadedChatId] = useState<string | null>(null);
  const [errorChatId, setErrorChatId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<MessageCursor | null>(null);
  const [loadingOlderChatId, setLoadingOlderChatId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const loadingOlderRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      requestIdRef.current += 1;
    };
  }, []);

  async function reload() {
    if (!chatId) return;
    const requestId = ++requestIdRef.current;
    setLoadedChatId(null);
    setErrorChatId(null);
    setError(null);
    loadingOlderRef.current = false;
    setLoadingOlderChatId(null);
    try {
      const page = await loadMessages(chatId);
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      setMessages(page.messages);
      setLoadedChatId(chatId);
      setHasMore(page.hasMore);
      setNextCursor(page.nextCursor);
    } catch (caught: unknown) {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setError(caught instanceof Error ? caught.message : 'Unable to load messages.');
        setErrorChatId(chatId);
      }
    }
  }

  // Latest-page refetch after a reconnect. Older pages already loaded are kept; the
  // token makes a stale response (or a chat switch) a no-op.
  const resyncIdRef = useRef(0);
  function resync() {
    if (!chatId) return;
    const resyncId = ++resyncIdRef.current;
    void loadMessages(chatId)
      .then((page) => {
        if (!mountedRef.current || resyncId !== resyncIdRef.current) return;
        setMessages((current) => page.messages.reduce(upsertMessage, current));
      })
      .catch(() => {
        // Background catch-up only; the visible list stays as it was and the next
        // event or manual reload repairs it.
      });
  }

  useChatMessageSubscription({
    chatId,
    enabled: Boolean(chatId),
onMessage: ({ type, message }) => {
      if (message.chatId !== chatId) return;
      setMessages((current) => {
        if (type === 'update' && !current.some((existing) => existing.id === message.id)) return current;
        return upsertMessage(current, message);
      });
    },
    onResync: resync,
  });

  useEffect(() => {
    resyncIdRef.current += 1;
  }, [chatId]);

  async function loadOlder() {
    if (!chatId || loadedChatId !== chatId || !hasMore || !nextCursor || loadingOlderRef.current) {
      return;
    }
    const requestId = ++requestIdRef.current;
    loadingOlderRef.current = true;
    setLoadingOlderChatId(chatId);
    setError(null);
    try {
      const page = await loadMessages(chatId, { cursor: nextCursor });
      if (!mountedRef.current || requestId !== requestIdRef.current) return;
      setMessages((current) => {
        const existingIds = new Set(current.map((message) => message.id));
        const uniqueOlder = page.messages.filter((message) => !existingIds.has(message.id));
        return [...uniqueOlder, ...current];
      });
      setHasMore(page.hasMore);
      setNextCursor(page.nextCursor);
    } catch (caught: unknown) {
      if (mountedRef.current && requestId === requestIdRef.current) {
        setError(caught instanceof Error ? caught.message : 'Unable to load older messages.');
        setErrorChatId(chatId);
      }
    } finally {
      loadingOlderRef.current = false;
      if (mountedRef.current && requestId === requestIdRef.current) setLoadingOlderChatId(null);
    }
  }

  useEffect(() => {
    if (!chatId) {
      requestIdRef.current += 1;
      return;
    }

    let active = true;
    const requestId = ++requestIdRef.current;
    loadingOlderRef.current = false;
    void loadMessages(chatId)
      .then((page) => {
        if (!active || !mountedRef.current || requestId !== requestIdRef.current) return;
        setMessages(page.messages);
        setLoadedChatId(chatId);
        setErrorChatId(null);
        setError(null);
        setHasMore(page.hasMore);
        setNextCursor(page.nextCursor);
      })
      .catch((caught: unknown) => {
        if (active && mountedRef.current && requestId === requestIdRef.current) {
          setError(caught instanceof Error ? caught.message : 'Unable to load messages.');
          setErrorChatId(chatId);
        }
      });
    return () => {
      active = false;
      if (requestId === requestIdRef.current) requestIdRef.current += 1;
    };
  }, [chatId]);

  return {
    messages: chatId && loadedChatId === chatId ? messages : [],
    loading: Boolean(chatId && loadedChatId !== chatId && errorChatId !== chatId),
    loadingOlder: Boolean(chatId && loadingOlderChatId === chatId),
    hasMore: Boolean(chatId && loadedChatId === chatId && hasMore),
    error: errorChatId === chatId ? error : null,
    reload,
    loadOlder,
  };
}

function useChatMutation<TInput, TResult>(operation: (input: TInput) => Promise<TResult>) {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const savingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  async function submit(input: TInput): Promise<TResult | null> {
    if (savingRef.current) return null;

    savingRef.current = true;
    setSaving(true);
    setSuccess(false);
    setError(null);
    try {
      const result = await operation(input);
      if (mountedRef.current) setSuccess(true);
      return result;
    } catch (caught: unknown) {
      if (mountedRef.current) {
        setError(caught instanceof Error ? caught.message : 'Unable to complete chat action.');
      }
      return null;
    } finally {
      savingRef.current = false;
      if (mountedRef.current) setSaving(false);
    }
  }

  return { saving, success, error, submit };
}

function useChatAction<TInput>(operation: (input: TInput) => Promise<void>) {
  return useChatMutation<TInput, void>(operation);
}

export function useCreateDirectChat() {
  return useChatMutation<CreateDirectChatInput, ChatConversation>(createDirectChat);
}

export function useCreateGroupChat() {
  return useChatMutation<CreateGroupChatInput, ChatConversation>(createGroupChat);
}

export function useCreateClubChat() {
  return useChatMutation<CreateClubChatInput, ChatConversation>(createClubChat);
}

export function useCreateMarketplaceChat() {
  return useChatMutation<CreateMarketplaceChatInput, ChatConversation>(createMarketplaceChat);
}

export function useSendChatMessage() {
  return useChatMutation<SendChatMessageInput, ChatMessage>(sendMessage);
}

export function useSendChatMessageWithImages() {
  return useChatMutation<
    { message: Omit<SendChatMessageInput, 'media'>; images: readonly ImageUploadSource[] },
    ChatMessage
  >(({ message, images }) => sendMessageWithImages(message, images));
}

export function useInviteChatMember() {
  return useChatMutation<{ chatId: string; userId: string }, string>(({ chatId, userId }) =>
    inviteMember(chatId, userId),
  );
}

export function useLeaveChat() {
  return useChatAction<{ chatId: string }>(({ chatId }) => leaveChat(chatId));
}

export function useRemoveChatMember() {
  return useChatAction<{ chatId: string; userId: string }>(({ chatId, userId }) =>
    removeMember(chatId, userId),
  );
}

export function useSetChatMemberRole() {
  return useChatAction<{ chatId: string; userId: string; role: 'owner' | 'member' }>(
    ({ chatId, userId, role }) => setMemberRole(chatId, userId, role),
  );
}

export function useMarkChatRead() {
  return useChatAction<{ chatId: string; messageId: string | null }>(({ chatId, messageId }) =>
    markChatRead(chatId, messageId),
  );
}

export function useChatTestActions() {
  return {
    direct: useCreateDirectChat(),
    group: useCreateGroupChat(),
    club: useCreateClubChat(),
    marketplace: useCreateMarketplaceChat(),
    sendMessage: useSendChatMessage(),
    invite: useInviteChatMember(),
    removeMember: useRemoveChatMember(),
    setMemberRole: useSetChatMemberRole(),
    leave: useLeaveChat(),
    markRead: useMarkChatRead(),
  };
}
