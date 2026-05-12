import { getChatStorageKey } from './chatStorageKeys.js'
import { createEmptyChat, normalizeChat } from '../utils/chatModel.js'

function canUseLocalStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function getFallbackState() {
  const initialChat = createEmptyChat()

  return {
    activeChatId: initialChat.id,
    chats: [initialChat],
    deletedChatIds: []
  }
}

export function loadChatState(namespace) {
  if (!canUseLocalStorage()) {
    return getFallbackState()
  }

  try {
    const storageKey = getChatStorageKey(namespace)
    const rawState = window.localStorage.getItem(storageKey)

    if (!rawState) {
      return getFallbackState()
    }

    const parsedState = JSON.parse(rawState)
    const chats = Array.isArray(parsedState?.chats)
      ? parsedState.chats.map(normalizeChat).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      : []

    if (!chats.length) {
      return getFallbackState()
    }

    const activeChatId = chats.some((chat) => chat.id === parsedState?.activeChatId)
      ? parsedState.activeChatId
      : chats[0].id

    return {
      activeChatId,
      chats,
      deletedChatIds: Array.isArray(parsedState?.deletedChatIds)
        ? parsedState.deletedChatIds.filter(Boolean)
        : []
    }
  } catch {
    return getFallbackState()
  }
}

export function saveChatState(namespace, state) {
  if (!canUseLocalStorage()) return

  const storageKey = getChatStorageKey(namespace)
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(state))
  } catch (error) {
    if (!isQuotaExceededError(error)) {
      throw error
    }

    const compactState = compactChatStateForStorage(state)
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(compactState))
    } catch {
      window.localStorage.removeItem(storageKey)
    }
  }
}

function isQuotaExceededError(error) {
  return error?.name === 'QuotaExceededError' || error?.code === 22 || error?.code === 1014
}

function compactChatStateForStorage(state) {
  const chats = Array.isArray(state?.chats) ? state.chats : []
  const compactChats = chats
    .slice()
    .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')))
    .slice(0, 8)
    .map((chat) => ({
      ...chat,
      messages: Array.isArray(chat.messages)
        ? chat.messages.slice(-20).map((message) => ({
          ...message,
          assistantActivityEvents: [],
          assistantActivitySummary: [],
          metadata: null
        }))
        : []
    }))

  return {
    activeChatId: compactChats.some((chat) => chat.id === state?.activeChatId)
      ? state.activeChatId
      : compactChats[0]?.id || state?.activeChatId,
    chats: compactChats,
    deletedChatIds: []
  }
}
