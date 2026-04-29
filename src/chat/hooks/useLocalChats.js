import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../auth/useAuth.js'
import { loadChatState, saveChatState } from '../storage/chatStorage.js'
import {
  createEmptyChat,
  createMessage,
  EMPTY_CHAT_TITLE,
  formatChatTimestamp,
  getChatGroup,
  getLastMessagePreview,
  toChatTitle
} from '../utils/chatModel.js'

export function useLocalChats() {
  const { currentUser, isGuestMode } = useAuth()
  const namespace = useMemo(
    () => ({
      isGuestMode,
      uid: currentUser?.uid || null
    }),
    [currentUser?.uid, isGuestMode]
  )

  const [chatState, setChatState] = useState(() => loadChatState(namespace))
  const [isResponding, setIsResponding] = useState(false)

  useEffect(() => {
    saveChatState(namespace, chatState)
  }, [chatState, namespace])

  const chats = useMemo(
    () => [...chatState.chats].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [chatState.chats]
  )

  const activeChat = useMemo(
    () => chats.find((chat) => chat.id === chatState.activeChatId) ?? chats[0] ?? null,
    [chatState.activeChatId, chats]
  )

  const sidebarChats = useMemo(
    () =>
      chats.map((chat) => ({
        ...chat,
        group: getChatGroup(chat.updatedAt),
        updatedAtLabel: formatChatTimestamp(chat.updatedAt)
      })),
    [chats]
  )

  const chatsByGroup = useMemo(() => {
    return sidebarChats.reduce((accumulator, chat) => {
      if (!accumulator[chat.group]) {
        accumulator[chat.group] = []
      }

      accumulator[chat.group].push(chat)
      return accumulator
    }, {})
  }, [sidebarChats])

  const setChats = (updater) => {
    setChatState((currentState) => {
      const nextChats =
        typeof updater === 'function' ? updater(currentState.chats) : updater

      const sortedChats = [...nextChats].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      const fallbackChat = sortedChats[0] ?? createEmptyChat()
      const activeChatId = sortedChats.some((chat) => chat.id === currentState.activeChatId)
        ? currentState.activeChatId
        : fallbackChat.id

      return {
        activeChatId,
        chats: sortedChats.length ? sortedChats : [fallbackChat],
        deletedChatIds: currentState.deletedChatIds
      }
    })
  }

  const setActiveChatId = (chatId) => {
    setChatState((currentState) => ({
      ...currentState,
      activeChatId: chatId
    }))
  }

  const createChat = () => {
    const nextChat = createEmptyChat()

    setChatState((currentState) => ({
      activeChatId: nextChat.id,
      chats: [nextChat, ...currentState.chats],
      deletedChatIds: currentState.deletedChatIds
    }))

    return nextChat.id
  }

  const renameChat = (chatId, title) => {
    const nextTitle = title.trim()
    if (!nextTitle) return

    setChats((currentChats) =>
      currentChats.map((chat) =>
        chat.id === chatId
          ? {
              ...chat,
              title: nextTitle,
              dirty: true,
              syncState: 'pending'
            }
          : chat
      )
    )
  }

  const deleteChat = (chatId) => {
    setChatState((currentState) => {
      const chatToDelete = currentState.chats.find((chat) => chat.id === chatId)
      const filteredChats = currentState.chats.filter((chat) => chat.id !== chatId)
      const nextDeletedChatIds = chatToDelete?.remoteId
        ? [...currentState.deletedChatIds, chatToDelete.remoteId]
        : currentState.deletedChatIds

      if (!filteredChats.length) {
        const fallbackChat = createEmptyChat()
        return {
          activeChatId: fallbackChat.id,
          chats: [fallbackChat],
          deletedChatIds: nextDeletedChatIds
        }
      }

      const nextActiveChatId =
        currentState.activeChatId === chatId ? filteredChats[0].id : currentState.activeChatId

      return {
        activeChatId: nextActiveChatId,
        chats: filteredChats,
        deletedChatIds: nextDeletedChatIds
      }
    })
  }

  const appendUserMessage = (chatId, content, overrides = {}) => {
    const userMessage = createMessage('user', content, overrides)
    const now = new Date().toISOString()

    setChats((currentChats) =>
      currentChats.map((chat) => {
        if (chat.id !== chatId) return chat

        const messages = [...chat.messages, userMessage]
        const nextTitle =
          chat.title === EMPTY_CHAT_TITLE && chat.messages.length === 0
            ? toChatTitle(content)
            : chat.title

        return {
          ...chat,
          title: nextTitle,
          updatedAt: now,
          dirty: true,
          syncState: 'pending',
          messages,
          lastMessagePreview: getLastMessagePreview(messages)
        }
      })
    )

    return userMessage.id
  }

  const appendAssistantPlaceholder = (chatId, requestId, overrides = {}) => {
    const assistantMessage = createMessage('assistant', '', {
      requestId,
      retryable: false,
      status: 'loading',
      ...overrides
    })
    const now = new Date().toISOString()

    setChats((currentChats) =>
      currentChats.map((chat) => {
        if (chat.id !== chatId) return chat

        const messages = [...chat.messages, assistantMessage]
        return {
          ...chat,
          updatedAt: now,
          dirty: true,
          syncState: 'pending',
          messages,
          lastMessagePreview: 'Thinking…'
        }
      })
    )

    setIsResponding(true)
    return assistantMessage.id
  }

  const updateAssistantMessage = (chatId, messageId, updater) => {
    const timestamp = new Date().toISOString()

    setChatState((currentState) => {
      const nextChats = currentState.chats.map((chat) => {
        if (chat.id !== chatId) return chat

        const messages = chat.messages.map((message) =>
          message.id === messageId ? updater(message) : message
        )

        return {
          ...chat,
          updatedAt: timestamp,
          dirty: true,
          syncState: 'pending',
          messages,
          lastMessagePreview: getLastMessagePreview(messages)
        }
      })

      return {
        ...currentState,
        chats: nextChats.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      }
    })
  }

  const resolveAssistantMessage = (chatId, messageId, content, overrides = {}) => {
    updateAssistantMessage(chatId, messageId, (message) => ({
      ...message,
      content,
      status: 'sent',
      error: '',
      retryable: false,
      ...overrides
    }))
    setIsResponding(false)
  }

  const patchAssistantMessage = (chatId, messageId, updater) => {
    updateAssistantMessage(chatId, messageId, (message) => ({
      ...message,
      ...(typeof updater === 'function' ? updater(message) : updater)
    }))
  }

  const failAssistantMessage = (chatId, messageId, error, overrides = {}) => {
    updateAssistantMessage(chatId, messageId, (message) => ({
      ...message,
      content: '',
      status: 'error',
      error,
      retryable: true,
      ...overrides
    }))
    setIsResponding(false)
  }

  const cancelAssistantMessage = (chatId, messageId) => {
    updateAssistantMessage(chatId, messageId, (message) => ({
      ...message,
      content: '',
      status: 'cancelled',
      error: 'Generation stopped.',
      retryable: true
    }))
    setIsResponding(false)
  }

  const getUserMessageForRequest = (chatId, requestId) => {
    const chat = chats.find((currentChat) => currentChat.id === chatId)
    return chat?.messages.find(
      (message) => message.role === 'user' && message.requestId === requestId
    ) || null
  }

  const clearAssistantMessage = (chatId, messageId) => {
    setChatState((currentState) => {
      const nextChats = currentState.chats.map((chat) => {
        if (chat.id !== chatId) return chat

        const messages = chat.messages.filter((message) => message.id !== messageId)
        return {
          ...chat,
          messages,
          dirty: true,
          syncState: 'pending',
          lastMessagePreview: getLastMessagePreview(messages)
        }
      })

      return {
        ...currentState,
        chats: nextChats,
        deletedChatIds: currentState.deletedChatIds
      }
    })
  }

  const replaceChatState = (nextState) => {
    setChatState((currentState) => ({
      activeChatId: nextState.activeChatId || currentState.activeChatId,
      chats: (nextState.chats || currentState.chats).map((chat) => ({
        ...chat
      })),
      deletedChatIds: nextState.deletedChatIds || currentState.deletedChatIds
    }))
  }

  const clearDeletedChatIds = (idsToClear) => {
    setChatState((currentState) => ({
      ...currentState,
      deletedChatIds: currentState.deletedChatIds.filter((chatId) => !idsToClear.includes(chatId))
    }))
  }

  const markChatsSynced = (chatIds) => {
    const now = new Date().toISOString()

    setChatState((currentState) => ({
      ...currentState,
      chats: currentState.chats.map((chat) =>
        chatIds.includes(chat.id)
          ? {
              ...chat,
              dirty: false,
              syncState: 'synced',
              lastSyncedAt: now
            }
          : chat
      )
    }))
  }

  return {
    activeChat,
    activeChatId: activeChat?.id || null,
    chats,
    chatsByGroup,
    createChat,
    deleteChat,
    appendAssistantPlaceholder,
    appendUserMessage,
    cancelAssistantMessage,
    clearAssistantMessage,
    failAssistantMessage,
    getUserMessageForRequest,
    isResponding,
    deletedChatIds: chatState.deletedChatIds,
    clearDeletedChatIds,
    markChatsSynced,
    patchAssistantMessage,
    renameChat,
    replaceChatState,
    resolveAssistantMessage,
    selectChat: setActiveChatId,
    setIsResponding
  }
}
