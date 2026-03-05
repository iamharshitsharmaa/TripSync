import { create } from 'zustand'

/**
 * Persists chat state per tripId so messages survive route changes.
 *
 * Shape per tripId:
 *   messages : Message[]   – ordered oldest → newest
 *   page     : number      – last fetched page (for "load more")
 *   hasMore  : boolean     – whether older pages exist
 *   loaded   : boolean     – initial fetch already done
 */
const useChatStore = create((set, get) => ({
  // ── State ────────────────────────────────────────────────
  chats: {},   // { [tripId]: { messages, page, hasMore, loaded } }

  // ── Helpers ──────────────────────────────────────────────
  _getChat: (tripId) =>
    get().chats[tripId] || { messages: [], page: 1, hasMore: true, loaded: false },

  _patchChat: (tripId, patch) =>
    set(s => ({
      chats: {
        ...s.chats,
        [tripId]: { ...s.chats[tripId], ...patch },
      },
    })),

  // ── Actions ──────────────────────────────────────────────

  /** Called after initial page-1 fetch */
  initMessages: (tripId, messages, hasMore) =>
    set(s => ({
      chats: {
        ...s.chats,
        [tripId]: { messages, page: 1, hasMore, loaded: true },
      },
    })),

  /** Called when user clicks "Load older" — prepends to front */
  prependMessages: (tripId, older, nextPage, hasMore) =>
    set(s => {
      const existing = s.chats[tripId]?.messages || []
      // de-dupe by _id
      const ids = new Set(existing.map(m => m._id))
      const fresh = older.filter(m => !ids.has(m._id))
      return {
        chats: {
          ...s.chats,
          [tripId]: {
            ...s.chats[tripId],
            messages: [...fresh, ...existing],
            page: nextPage,
            hasMore,
          },
        },
      }
    }),

  /** Real-time new message arrives (or optimistic send) */
  addMessage: (tripId, message) =>
    set(s => {
      const existing = s.chats[tripId]?.messages || []
      // avoid duplicates from optimistic + socket echo
      if (existing.some(m => m._id === message._id)) return s
      return {
        chats: {
          ...s.chats,
          [tripId]: {
            ...s.chats[tripId],
            messages: [...existing, message],
          },
        },
      }
    }),

  /** Socket or API delete */
  removeMessage: (tripId, msgId) =>
    set(s => ({
      chats: {
        ...s.chats,
        [tripId]: {
          ...s.chats[tripId],
          messages: (s.chats[tripId]?.messages || []).filter(m => m._id !== msgId),
        },
      },
    })),
}))

export default useChatStore