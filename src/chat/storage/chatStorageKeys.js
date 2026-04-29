const CHAT_STORAGE_PREFIX = 'otanai:web:chat-state'

export function getChatStorageKey({ isGuestMode, uid }) {
  if (isGuestMode || !uid) {
    return `${CHAT_STORAGE_PREFIX}:guest`
  }

  return `${CHAT_STORAGE_PREFIX}:user:${uid}`
}
