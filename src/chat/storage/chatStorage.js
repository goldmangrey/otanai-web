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
  window.localStorage.setItem(storageKey, JSON.stringify(state))
}
