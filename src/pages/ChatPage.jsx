import { useEffect, useMemo, useRef, useState } from 'react'
import AppSidebar from '../components/chat/AppSidebar.jsx'
import AuthBenefitModal from '../components/chat/AuthBenefitModal.jsx'
import AuthModal from '../components/chat/AuthModal.jsx'
import AnswerFeedbackControls from '../components/chat/AnswerFeedbackControls.jsx'
import AssistantActivityPill from '../components/chat/AssistantActivityPill.jsx'
import AssistantFollowupChips from '../components/chat/AssistantFollowupChips.jsx'
import ChatComposer from '../components/chat/ChatComposer.jsx'
import ChatMessageContent from '../components/chat/ChatMessageContent.jsx'
import ChatTopbar from '../components/chat/ChatTopbar.jsx'
import StreamingActivity from '../chat/rich-response/streaming/StreamingActivity.jsx'
import { useAuth } from '../auth/useAuth.js'
import { useLocalChats } from '../chat/hooks/useLocalChats.js'
import { copyText } from '../chat/utils/clipboard.js'
import { useCloudSync } from '../chat/persistence/useCloudSync.js'
import { useChatRuntime } from '../chat/hooks/useChatRuntime.js'
import { hasAssistantActivityEvents } from '../chat/utils/assistantActivity.js'
import {
  dismissAuthBenefitModal,
  hasDismissedAuthBenefitModal,
  shouldShowAuthBenefitModal
} from '../chat/utils/authBenefitModal.js'
import { useI18n } from '../i18n/useI18n.js'

const SCROLL_BOTTOM_THRESHOLD = 120

function ChatPageContent() {
  const { authLoading, currentUser, isAuthenticated } = useAuth()
  const { t } = useI18n()
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isAuthBenefitModalDismissed, setIsAuthBenefitModalDismissed] = useState(() =>
    hasDismissedAuthBenefitModal()
  )
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

  const isAuthBenefitModalOpen = shouldShowAuthBenefitModal({
    authLoading,
    isAuthenticated,
    dismissed: isAuthBenefitModalDismissed
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
    const shouldLock = isMobileSidebarOpen || isAuthModalOpen || isAuthBenefitModalOpen
    const previousOverflow = document.body.style.overflow

    if (shouldLock) {
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isAuthBenefitModalOpen, isAuthModalOpen, isMobileSidebarOpen])

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

  const closeAuthBenefitModal = () => {
    dismissAuthBenefitModal()
    setIsAuthBenefitModalDismissed(true)
  }

  const handleAuthBenefitSignIn = () => {
    closeAuthBenefitModal()
    setIsAuthModalOpen(true)
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
          ) : !activeChat?.messages.length ? null : (
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
                const hasNpaActivity =
                  message.role === 'assistant' &&
                  hasAssistantActivityEvents(message.assistantActivityEvents?.length ? message.assistantActivityEvents : message.metadata)

                return (
                  <article
                    key={message.id}
                    className={`chat-message chat-message--${message.role}`}
                  >
                    <div className={`chat-message__body ${isLoading ? 'chat-message__body--loading' : ''}`}>
                      {isLoading ? (
                        <>
                          {hasNpaActivity ? (
                            <AssistantActivityPill
                              events={message.assistantActivityEvents || []}
                              metadata={message.metadata}
                              isStreaming={isRequestActive}
                            />
                          ) : (
                            <StreamingActivity
                              message={message}
                              metadata={message.metadata}
                              isStreaming={isRequestActive}
                            />
                          )}
                          {hasLiveStreamingContent ? (
                            <ChatMessageContent
                              message={message}
                              content={message.content}
                              metadata={message.metadata}
                              showResearchActivity={false}
                            />
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
                        <>
                          {hasNpaActivity ? (
                            <AssistantActivityPill
                              events={message.assistantActivityEvents || []}
                              metadata={message.metadata}
                              isStreaming={false}
                            />
                          ) : null}
                          <ChatMessageContent
                            message={message}
                            content={message.content}
                            metadata={message.metadata}
                          />
                          {message.role === 'assistant' ? (
                            <AssistantFollowupChips
                              followups={message.followups || []}
                              metadata={message.metadata}
                              disabled={isRequestActive}
                              onSelect={(query) => handleSendMessage(query)}
                            />
                          ) : null}
                        </>
                      )}
                    </div>

                    {!isLoading && showActions ? (
                      <div className="chat-message__actions" aria-label="Message actions">
                        {message.role === 'assistant' && message.status === 'sent' ? (
                          <AnswerFeedbackControls
                            chatId={activeChatId}
                            currentUser={currentUser}
                            message={message}
                            onRequireSignIn={() => setIsAuthModalOpen(true)}
                          />
                        ) : null}

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

      <AuthBenefitModal
        isOpen={isAuthBenefitModalOpen}
        onClose={closeAuthBenefitModal}
        onSignIn={handleAuthBenefitSignIn}
      />
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
