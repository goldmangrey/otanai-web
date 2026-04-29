import { normalizeChat } from '../utils/chatModel.js'

function getComparableTimestamp(chat) {
  return chat.updatedAt || chat.lastSyncedAt || chat.createdAt || ''
}

export function mergeChats(localChats, remoteChats) {
  const mergedMap = new Map()

  localChats.forEach((chat) => {
    mergedMap.set(chat.remoteId || chat.id, normalizeChat(chat))
  })

  remoteChats.forEach((remoteChat) => {
    const normalizedRemoteChat = normalizeChat({
      ...remoteChat,
      remoteId: remoteChat.remoteId || remoteChat.id,
      dirty: false,
      syncState: 'synced',
      lastSyncedAt: new Date().toISOString()
    })

    const key = normalizedRemoteChat.remoteId || normalizedRemoteChat.id
    const existingChat = mergedMap.get(key)

    if (!existingChat) {
      mergedMap.set(key, normalizedRemoteChat)
      return
    }

    const useRemoteVersion =
      getComparableTimestamp(normalizedRemoteChat) >= getComparableTimestamp(existingChat)

    mergedMap.set(key, useRemoteVersion ? normalizedRemoteChat : existingChat)
  })

  return [...mergedMap.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}
