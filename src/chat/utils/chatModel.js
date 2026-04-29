const EMPTY_CHAT_TITLE = 'New chat'

export function createChatId() {
  return `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function createMessageId(role) {
  return `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function createMessage(role, content, overrides = {}) {
  return {
    id: createMessageId(role),
    role,
    content,
    createdAt: new Date().toISOString(),
    status: 'sent',
    error: '',
    requestId: null,
    retryable: false,
    ...overrides
  }
}

export function toChatTitle(text) {
  const sanitized = text
    .replace(/[#>*_`[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!sanitized) return EMPTY_CHAT_TITLE

  const firstSentence = sanitized.split(/[.!?]/)[0]?.trim() || sanitized
  const normalizedTitle = firstSentence.length > 44
    ? `${firstSentence.slice(0, 44).trim()}…`
    : firstSentence

  return normalizedTitle || EMPTY_CHAT_TITLE
}

export function createEmptyChat(overrides = {}) {
  const now = new Date().toISOString()

  return {
    id: createChatId(),
    title: EMPTY_CHAT_TITLE,
    createdAt: now,
    updatedAt: now,
    lastMessagePreview: '',
    remoteId: null,
    syncState: 'local-only',
    lastSyncedAt: null,
    dirty: true,
    deletedAt: null,
    version: 1,
    messages: [],
    ...overrides
  }
}

export function getLastMessagePreview(messages) {
  const lastMessage = messages.at(-1)
  if (!lastMessage?.content) return ''

  const preview = lastMessage.content.replace(/\s+/g, ' ').trim()
  return preview.length > 72 ? `${preview.slice(0, 72)}…` : preview
}

export function formatChatTimestamp(timestamp) {
  if (!timestamp) return ''

  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return ''

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfTargetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((startOfToday - startOfTargetDay) / 86400000)

  if (diffDays === 0) {
    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (diffDays === 1) {
    return 'Yesterday'
  }

  return date.toLocaleDateString([], {
    month: 'short',
    day: 'numeric'
  })
}

export function getChatGroup(timestamp) {
  if (!timestamp) return 'Previous 7 days'

  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return 'Previous 7 days'

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfTargetDay = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((startOfToday - startOfTargetDay) / 86400000)

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  return 'Previous 7 days'
}

export function normalizeChat(chat) {
  const messages = Array.isArray(chat.messages) ? chat.messages : []
  const updatedAt = chat.updatedAt || chat.createdAt || new Date().toISOString()

  return {
    id: chat.id || createChatId(),
    title: chat.title || EMPTY_CHAT_TITLE,
    createdAt: chat.createdAt || updatedAt,
    updatedAt,
    lastMessagePreview: chat.lastMessagePreview || getLastMessagePreview(messages),
    remoteId: chat.remoteId || null,
    syncState: chat.syncState || 'local-only',
    lastSyncedAt: chat.lastSyncedAt || null,
    dirty: Boolean(chat.dirty),
    deletedAt: chat.deletedAt || null,
    version: chat.version || 1,
    messages: messages.map((message) => ({
      id: message.id || createMessageId(message.role || 'assistant'),
      role: message.role || 'assistant',
      content: message.content || '',
      createdAt: message.createdAt || updatedAt,
      status: message.status || 'sent',
      error: message.error || '',
      requestId: message.requestId || null,
      retryable: Boolean(message.retryable),
      metadata: message.metadata || null
    }))
  }
}

export { EMPTY_CHAT_TITLE }
