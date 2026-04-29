export function createSyncQueuePayload({ chats, deletedChatIds }) {
  return {
    chats: chats.filter((chat) => chat.dirty && !chat.deletedAt),
    deletedChatIds: deletedChatIds.filter(Boolean)
  }
}
