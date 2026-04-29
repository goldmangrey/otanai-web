function getPersistenceConfig() {
  const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || ''
  const listPath = import.meta.env.VITE_CHAT_PERSISTENCE_LIST_PATH || ''
  const syncPath = import.meta.env.VITE_CHAT_PERSISTENCE_SYNC_PATH || ''

  return {
    baseUrl,
    listPath,
    syncPath,
    isConfigured: Boolean(baseUrl && listPath && syncPath)
  }
}

async function requestJson(url, { body, method = 'GET', token }) {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    throw new Error(data?.error || data?.message || 'Cloud sync request failed.')
  }

  return data
}

export function isCloudPersistenceConfigured() {
  return getPersistenceConfig().isConfigured
}

export async function listRemoteChats({ token }) {
  const config = getPersistenceConfig()
  if (!config.isConfigured) {
    return { chats: [] }
  }

  const data = await requestJson(`${config.baseUrl}${config.listPath}`, {
    token
  })

  return {
    chats: Array.isArray(data?.chats) ? data.chats : []
  }
}

export async function syncRemoteChats({ chats, deletedChatIds, token }) {
  const config = getPersistenceConfig()
  if (!config.isConfigured) {
    return {
      chats: [],
      deletedChatIds: []
    }
  }

  const data = await requestJson(`${config.baseUrl}${config.syncPath}`, {
    method: 'POST',
    token,
    body: {
      chats,
      deletedChatIds
    }
  })

  return {
    chats: Array.isArray(data?.chats) ? data.chats : [],
    deletedChatIds: Array.isArray(data?.deletedChatIds) ? data.deletedChatIds : []
  }
}
