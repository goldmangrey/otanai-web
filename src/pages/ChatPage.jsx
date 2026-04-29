import { useEffect, useMemo, useRef, useState } from 'react'
import AppSidebar from '../components/chat/AppSidebar.jsx'
import AuthModal from '../components/chat/AuthModal.jsx'
import ChatComposer from '../components/chat/ChatComposer.jsx'
import ChatMessageContent from '../components/chat/ChatMessageContent.jsx'
import ChatTopbar from '../components/chat/ChatTopbar.jsx'
import EmptyState from '../components/chat/EmptyState.jsx'
import { useAuth } from '../auth/useAuth.js'
import { useLocalChats } from '../chat/hooks/useLocalChats.js'
import { copyText } from '../chat/utils/clipboard.js'
import { useCloudSync } from '../chat/persistence/useCloudSync.js'
import { useChatRuntime } from '../chat/hooks/useChatRuntime.js'
import { normalizeActivity, shouldShowResearchActivity } from '../chat/utils/activity.js'
import { useI18n } from '../i18n/useI18n.js'

const SCROLL_BOTTOM_THRESHOLD = 120

const SUGGESTION_KEYS = ['suggestion1', 'suggestion2', 'suggestion3', 'suggestion4']

function getLatestActivityLabel(metadata) {
  const activity = normalizeActivity(metadata)
  if (!shouldShowResearchActivity(activity, metadata)) return ''
  const item =
    [...activity].reverse().find((currentItem) =>
      ['running', 'pending'].includes(currentItem.status)
    ) || activity.at(-1)

  return item?.label ? `${item.label}...` : ''
}

function ChatPageContent() {
  const { currentUser } = useAuth()
  const { t } = useI18n()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false)
  const [showScrollToLatest, setShowScrollToLatest] = useState(false)
  const [copiedMessageId, setCopiedMessageId] = useState('')
  const transcriptRef = useRef(null)
  const shouldStickToBottomRef = useRef(true)

  const {
    activeChat,
    activeChatId,
    appendAssistantPlaceholder,
    appendUserMessage,
    cancelAssistantMessage,
    chats,
    chatsByGroup,
    clearDeletedChatIds,
    createChat,
    deletedChatIds,
    deleteChat,
    failAssistantMessage,
    isResponding,
    markChatsSynced,
    patchAssistantMessage,
    renameChat,
    replaceChatState,
    resolveAssistantMessage,
    selectChat
  } = useLocalChats()

  const { syncConfigured, syncError, syncMode, syncStatus } = useCloudSync({
    activeChatId,
    chats,
    deletedChatIds,
    replaceChatState,
    clearDeletedChatIds,
    markChatsSynced
  })

  const {
    cancelActiveRequest,
    isRequestActive,
    regenerateLatestResponse,
    retryMessage,
    sendMessage
  } = useChatRuntime({
    activeChat,
    appendAssistantPlaceholder,
    appendUserMessage,
    cancelAssistantMessage,
    failAssistantMessage,
    patchAssistantMessage,
    resolveAssistantMessage
  })

  const activeMessagesCount = activeChat?.messages.length ?? 0
  const latestAssistantMessageId =
    [...(activeChat?.messages || [])]
      .reverse()
      .find((message) => message.role === 'assistant')?.id || null

  const scrollToBottom = (behavior = 'smooth') => {
    const container = transcriptRef.current
    if (!container) return

    container.scrollTo({
      top: container.scrollHeight,
      behavior
    })
  }

  const updateScrollState = () => {
    const container = transcriptRef.current
    if (!container) return

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight
    const isNearBottom = distanceFromBottom <= SCROLL_BOTTOM_THRESHOLD

    shouldStickToBottomRef.current = isNearBottom
    setShowScrollToLatest(!isNearBottom)
  }

  useEffect(() => {
    const container = transcriptRef.current
    if (!container) return

    shouldStickToBottomRef.current = true

    window.requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'auto'
      })
      updateScrollState()
    })
  }, [activeChatId])

  useEffect(() => {
    const container = transcriptRef.current
    if (!container) return undefined

    const handleScroll = () => updateScrollState()

    container.addEventListener('scroll', handleScroll, { passive: true })
    updateScrollState()

    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!activeChat) return

    if (shouldStickToBottomRef.current) {
      scrollToBottom(activeMessagesCount > 1 ? 'smooth' : 'auto')
      window.requestAnimationFrame(() => updateScrollState())
      return
    }

    updateScrollState()
  }, [activeChat, activeMessagesCount, isResponding])

  useEffect(() => {
    const shouldLock = isMobileSidebarOpen || isAuthModalOpen
    const previousOverflow = document.body.style.overflow

    if (shouldLock) {
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isAuthModalOpen, isMobileSidebarOpen])

  useEffect(() => {
    if (!copiedMessageId) return undefined

    const timeoutId = window.setTimeout(() => {
      setCopiedMessageId('')
    }, 1600)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [copiedMessageId])

  const handleSelectChat = (chatId) => {
    selectChat(chatId)
    setIsMobileSidebarOpen(false)
  }

  const handleNewChat = () => {
    createChat()
    setIsMobileSidebarOpen(false)
  }

  const handleRenameChat = (chatId) => {
    const chat = Object.values(chatsByGroup)
      .flat()
      .find((currentChat) => currentChat.id === chatId)

    const nextTitle = window.prompt(t('renameChat'), chat?.title || '')
    if (!nextTitle) return

    renameChat(chatId, nextTitle)
  }

  const handleDeleteChat = (chatId) => {
    const chat = Object.values(chatsByGroup)
      .flat()
      .find((currentChat) => currentChat.id === chatId)

    const shouldDelete = window.confirm(
      t('deleteChatConfirm', { title: chat?.title || t('navChat') })
    )
    if (!shouldDelete) return

    deleteChat(chatId)
  }

  const handleSendMessage = (content) => {
    if (!activeChatId) return
    sendMessage(activeChatId, content)
  }

  const handleRetryMessage = (requestId) => {
    if (!activeChatId || !requestId || !activeChat) return

    const userMessage = activeChat.messages.find(
      (message) => message.role === 'user' && message.requestId === requestId
    )

    if (!userMessage) return
    retryMessage(activeChatId, userMessage.id)
  }

  const handleCopyMessage = async (messageId, content) => {
    if (!content) return

    try {
      await copyText(content)
      setCopiedMessageId(messageId)
    } catch {
      setCopiedMessageId('')
    }
  }

  const handleRegenerate = () => {
    if (!activeChatId) return
    regenerateLatestResponse(activeChatId)
  }

  const chatTitle = useMemo(() => activeChat?.title || 'OtanAI', [activeChat?.title])
  const syncLabel = useMemo(() => {
    if (!currentUser) return t('localWorkspace')
    if (!syncConfigured) return t('localHistory')
    if (syncStatus === 'syncing') return t('syncingChats')
    if (syncStatus === 'error') return syncError || t('syncUnavailable')
    if (syncMode === 'remote-ready') return t('cloudSyncActive')
    return t('localWorkspace')
  }, [currentUser, syncConfigured, syncError, syncMode, syncStatus, t])

  const suggestions = useMemo(() => SUGGESTION_KEYS.map((key) => t(key)), [t])

  return (
    <section className="chat-shell">
      <AppSidebar
        activeChatId={activeChatId}
        chatsByGroup={chatsByGroup}
        isCollapsed={isSidebarCollapsed}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onDeleteChat={handleDeleteChat}
        onNewChat={handleNewChat}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onRenameChat={handleRenameChat}
        onSelectChat={handleSelectChat}
      />

      <div className="chat-shell__main">
        <ChatTopbar
          isSidebarCollapsed={isSidebarCollapsed}
          syncLabel={syncLabel}
          title={chatTitle}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          onToggleSidebar={() => setIsSidebarCollapsed((collapsed) => !collapsed)}
        />

        <div className="chat-shell__content" ref={transcriptRef}>
          {!activeChat?.messages.length && syncStatus === 'syncing' && currentUser && syncConfigured ? (
            <div className="chat-transcript chat-transcript--skeleton" aria-hidden="true">
              {Array.from({ length: 3 }).map((_, index) => (
                <article
                  key={`skeleton-${index}`}
                  className={`chat-message ${index % 2 ? 'chat-message--user' : ''}`}
                >
                  <div className="chat-message__body chat-message__body--skeleton">
                    <span className="chat-skeleton-line chat-skeleton-line--long" />
                    <span className="chat-skeleton-line" />
                    <span className="chat-skeleton-line chat-skeleton-line--short" />
                  </div>
                </article>
              ))}
            </div>
          ) : !activeChat?.messages.length ? (
            <EmptyState
              suggestions={suggestions}
              onSelectSuggestion={handleSendMessage}
            />
          ) : (
            <div className="chat-transcript">
              {activeChat.messages.map((message) => {
                const canRegenerate =
                  message.role === 'assistant' &&
                  message.id === latestAssistantMessageId &&
                  message.status === 'sent' &&
                  !isRequestActive
                const showActions = message.content || canRegenerate
                const isLoading = message.status === 'loading'
                const hasLiveStreamingContent = isLoading && (message.content || message.metadata)

                return (
                  <article
                    key={message.id}
                    className={`chat-message chat-message--${message.role}`}
                  >
                    <div className={`chat-message__body ${isLoading ? 'chat-message__body--loading' : ''}`}>
                      {isLoading ? (
                        <>
                          <div className="chat-message__streaming" role="status" aria-live="polite">
                            <span className="chat-message__streaming-dot" aria-hidden="true" />
                            <span>{getLatestActivityLabel(message.metadata) || t('thinkingShort')}</span>
                          </div>
                          {hasLiveStreamingContent ? (
                            <ChatMessageContent content={message.content} metadata={message.metadata} />
                          ) : null}
                        </>
                      ) : message.status === 'error' || message.status === 'cancelled' ? (
                        <div className="chat-message__error">
                          <p>{message.error}</p>
                          <p className="chat-message__error-caption">
                            {t('retryHint')}
                          </p>
                          <div className="chat-message__error-actions">
                            <button
                              className="chat-message__retry"
                              type="button"
                              onClick={() => handleRetryMessage(message.requestId)}
                              disabled={!message.requestId || isRequestActive}
                            >
                              {t('retry')}
                            </button>
                            {!isRequestActive ? (
                              <button
                                className="chat-message__retry"
                                type="button"
                                onClick={handleRegenerate}
                              >
                                {t('regenerate')}
                              </button>
                            ) : null}
                          </div>
                        </div>
                      ) : (
                        <ChatMessageContent content={message.content} metadata={message.metadata} />
                      )}
                    </div>

                    {!isLoading && showActions ? (
                      <div className="chat-message__actions" aria-label="Message actions">
                        {message.content ? (
                          <button
                            aria-label={t('copyAnswer')}
                            className="chat-message__action"
                            title={t('copyAnswer')}
                            type="button"
                            onClick={() => handleCopyMessage(message.id, message.content)}
                          >
                            {copiedMessageId === message.id ? (
                              <span className="chat-message__action-text">{t('copied')}</span>
                            ) : (
                              <span aria-hidden="true">⧉</span>
                            )}
                          </button>
                        ) : null}

                        {canRegenerate ? (
                          <button
                            aria-label={t('regenerateAnswer')}
                            className="chat-message__action"
                            title={t('regenerateAnswer')}
                            type="button"
                            onClick={handleRegenerate}
                          >
                            <span aria-hidden="true">↻</span>
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </article>
                )
              })}
            </div>
          )}
        </div>

        <div className="chat-shell__composer">
          <button
            aria-label={t('scrollLatest')}
            className={`chat-scroll-to-latest ${showScrollToLatest ? 'is-visible' : ''}`}
            type="button"
            onClick={() => {
              shouldStickToBottomRef.current = true
              scrollToBottom('smooth')
            }}
          >
            <span className="chat-scroll-to-latest__icon">↓</span>
          </button>

          <ChatComposer
            isBusy={isRequestActive}
            onSend={handleSendMessage}
            onStop={cancelActiveRequest}
          />
        </div>
      </div>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </section>
  )
}

function ChatPage() {
  const { currentUser } = useAuth()
  const storageScopeKey = currentUser?.uid ? `user:${currentUser.uid}` : 'guest'

  return <ChatPageContent key={storageScopeKey} />
}

export default ChatPage
