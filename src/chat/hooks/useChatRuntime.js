import { useRef, useState } from 'react'
import { useAuth } from '../../auth/useAuth.js'
import { sendChatRequest } from '../api/chatClient.js'
import {
  sendLegalResearchDeepRequest,
  sendLegalResearchStreamRequest
} from '../api/legalResearchClient.js'
import { sendStreamingChatRequest } from '../api/streamChatClient.js'
import { applyV4StreamEvent, createV4StreamState } from '../../chat/rich-response/streaming/streamProtocolV4.js'
import { createV4RevealQueue } from '../../chat/rich-response/streaming/streamProtocolV4RevealQueue.js'
import {
  isStreamProtocolV4Enabled,
  isStreamSmoothRevealEnabled
} from '../../config/richResponseFlags.js'
import { logStreamV4Error } from '../../chat/rich-response/observability/richRendererLogger.js'
import { getChatRouteForMessage } from '../utils/chatRouting.js'
import { mergeLiveActivity, mergeLiveMetadata, mergeLiveSources } from '../utils/liveMetadata.js'
import { mergeAssistantActivityEvents } from '../utils/assistantActivity.js'
import { getLatestAssistantConversationContext } from '../utils/conversationContext.js'
import { createRequestId } from '../utils/requestIds.js'

const LEGAL_RESEARCH_SAFE_ERROR = 'Не удалось получить юридический ответ сейчас. Повторите запрос позже.'

export function getChatErrorMessage(error, { legalRoute = false } = {}) {
  if (error?.name === 'AbortError') {
    return 'Generation stopped.'
  }

  if (legalRoute) {
    return LEGAL_RESEARCH_SAFE_ERROR
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'The assistant request failed. Please try again.'
}

export function shouldRetryLegalDeepAfterStreamFailure(error) {
  return error?.name !== 'AbortError'
}

export function useChatRuntime({
  activeChat,
  appendAssistantPlaceholder,
  appendUserMessage,
  cancelAssistantMessage,
  failAssistantMessage,
  patchAssistantMessage,
  resolveAssistantMessage
}) {
  const { currentUser } = useAuth()
  const [activeRequest, setActiveRequest] = useState(null)
  const abortControllerRef = useRef(null)

  const runFallbackRequest = async ({
    assistantMessageId,
    chatId,
    content,
    messages,
    requestId,
    signal,
    token
  }) => {
    const response = await sendChatRequest({
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
      chatId,
      message: content,
      messages,
      requestId,
      signal,
      token
    })

    if (response.metadata?.rerouteToLegalResearch === true) {
      try {
        await runLegalDeepRequest({
          assistantMessageId,
          chatId,
          content,
          requestId,
          signal,
          token,
          previousAssistantContext: getLatestAssistantConversationContext(activeChat?.messages || [])
        })
      } catch (error) {
        error.legalResearchRoute = true
        throw error
      }
      return
    }

    resolveAssistantMessage(chatId, assistantMessageId, response.assistantText, {
      requestId,
      metadata: response.metadata
    })
  }

  const runStreamingRequest = async ({
    assistantMessageId,
    chatId,
    content,
    messages,
    requestId,
    signal,
    token
  }) => {
    let finalContent = ''
    let finalMetadata = null
    const streamState = {
      receivedData: false,
      v4: createV4StreamState()
    }
    const protocolVersion = isStreamProtocolV4Enabled() ? 4 : 3
    const smoothReveal = protocolVersion === 4 && isStreamSmoothRevealEnabled()

    const applyV4Envelope = (envelope) => {
      try {
        streamState.v4 = applyV4StreamEvent(streamState.v4, envelope)
      } catch (error) {
        logStreamV4Error(error, {
          source: envelope?.type || 'unknown',
          protocolVersion: 4
        })
        throw error
      }
      finalContent = streamState.v4.content
      patchAssistantMessage(chatId, assistantMessageId, () => ({
        content: streamState.v4.content,
        parts: streamState.v4.parts,
        metadata: mergeLiveMetadata(streamState.v4.metadata, {
          parts: streamState.v4.parts,
          protocolVersion: 4
        }),
        status: 'loading',
        error: '',
        retryable: false
      }))
    }

    const revealQueue = smoothReveal
      ? createV4RevealQueue({
          applyEvent: applyV4Envelope,
          onError: (error, event) => {
            logStreamV4Error(error, {
              source: event?.type || 'unknown',
              protocolVersion: 4
            })
          }
        })
      : null

    try {
      await sendStreamingChatRequest({
        apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
        token,
        signal,
        payload: {
          message: content,
          chatId,
          mode: 'chat',
          requestedMode: 'chat',
          requestedTier: 'free',
          protocolVersion,
          attachments: [],
          clientMessageId: requestId,
          config: {
            history: messages
          }
        },
        onMeta: (payload) => {
          streamState.receivedData = true
          patchAssistantMessage(chatId, assistantMessageId, (message) => ({
            metadata: mergeLiveMetadata(message.metadata, {
              requestId: payload.requestId,
              chatId: payload.chatId,
              autoRag: payload.autoRag,
              artifactIntent: payload.artifactIntent,
              mode: payload.mode
            })
          }))
        },
        onActivity: (payload) => {
          streamState.receivedData = true
          patchAssistantMessage(chatId, assistantMessageId, (message) => ({
            metadata: mergeLiveMetadata(message.metadata, {
              activity: mergeLiveActivity(message.metadata?.activity, [payload]),
              activityLabel: payload.mode === 'deep_research' ? 'Ход исследования' : 'Ход проверки',
              activityMode: payload.mode === 'deep_research' ? 'deep_research' : 'verification'
            })
          }))
        },
        onSourceFound: (payload) => {
          streamState.receivedData = true
          patchAssistantMessage(chatId, assistantMessageId, (message) => {
            const sources = mergeLiveSources(message.metadata?.sources, [payload])
            return {
              metadata: mergeLiveMetadata(message.metadata, {
                sources,
                citations: sources
              })
            }
          })
        },
        onV4Event: (_payload, envelope) => {
          if (protocolVersion !== 4) return
          streamState.receivedData = true
          if (revealQueue) {
            revealQueue.enqueue(envelope)
            return
          }
          applyV4Envelope(envelope)
        },
        onQualityUpdate: (payload) => {
          streamState.receivedData = true
          patchAssistantMessage(chatId, assistantMessageId, (message) => ({
            metadata: mergeLiveMetadata(message.metadata, {
              quality: payload
            })
          }))
        },
        onChunk: (delta) => {
          if (protocolVersion === 4) return
          if (!delta) return
          streamState.receivedData = true
          finalContent += delta
          patchAssistantMessage(chatId, assistantMessageId, (message) => ({
            content: `${message.content || ''}${delta}`,
            status: 'loading',
            error: '',
            retryable: false
          }))
        },
        onDone: (payload) => {
          streamState.receivedData = true
          if (protocolVersion === 4) {
            const doneEnvelope = { type: 'done', payload }
            if (revealQueue) {
              revealQueue.enqueue(doneEnvelope)
            } else {
              applyV4Envelope(doneEnvelope)
            }
          }
          finalMetadata = payload.metadata || null
        },
        onError: (_error, _payload, envelope) => {
          if (envelope) {
            streamState.receivedData = true
          }
        }
      })
      if (revealQueue) {
        await revealQueue.drain()
      }
    } catch (error) {
      revealQueue?.clear()
      error.receivedStreamData = streamState.receivedData
      throw error
    }

    if (!streamState.receivedData) {
      throw new Error('The streaming request did not return data.')
    }

    resolveAssistantMessage(chatId, assistantMessageId, finalContent, {
      requestId,
      metadata: mergeLiveMetadata(null, finalMetadata || {})
    })
  }

  const runLegalDeepRequest = async ({
    assistantMessageId,
    chatId,
    content,
    requestId,
    signal,
    token,
    previousAssistantContext = null
  }) => {
    const response = await sendLegalResearchDeepRequest({
      apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
      message: content,
      signal,
      token,
      previousAssistantContext
    })
    const assistantActivityEvents = mergeAssistantActivityEvents(
      response.metadata?.assistantActivityEvents,
      []
    )

    resolveAssistantMessage(chatId, assistantMessageId, response.assistantText, {
      requestId,
      assistantActivityEvents,
      assistantConversationContext: response.assistantConversationContext,
      followups: response.followups || response.metadata?.assistantFollowups || [],
      metadata: mergeLiveMetadata(response.metadata, {
        assistantActivityEvents: assistantActivityEvents.length
          ? assistantActivityEvents
          : response.metadata?.assistantActivityEvents,
        assistantFollowups: response.metadata?.assistantFollowups || response.followups || [],
        sourceTrace: response.sourceTrace,
        route: 'legal_research_deep'
      })
    })
  }

  const runLegalStreamingRequest = async ({
    assistantMessageId,
    chatId,
    content,
    requestId,
    signal,
    token,
    previousAssistantContext = null
  }) => {
    let finalContent = ''
    let finalMetadata = null
    let liveAssistantActivityEvents = []
    const streamState = { receivedData: false }

    try {
      await sendLegalResearchStreamRequest({
        apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
        message: content,
        signal,
        token,
        previousAssistantContext,
        onChunk: (delta) => {
          if (!delta) return
          streamState.receivedData = true
          finalContent += delta
          patchAssistantMessage(chatId, assistantMessageId, (message) => ({
            content: `${message.content || ''}${delta}`,
            status: 'loading',
            error: '',
            retryable: false
          }))
        },
        onEvent: (_payload, envelope) => {
          if (['qdrant_search_started', 'qdrant_results_found', 'report_section_ready'].includes(envelope?.type)) {
            streamState.receivedData = true
          }
        },
        onAssistantActivity: (payload, envelope) => {
          const incomingEvent = payload?.stage ? payload : envelope
          const normalizedEvents = mergeAssistantActivityEvents([], [incomingEvent])
          if (!normalizedEvents.length) return
          streamState.receivedData = true
          patchAssistantMessage(chatId, assistantMessageId, (message) => {
            const assistantActivityEvents = mergeAssistantActivityEvents(
              message.assistantActivityEvents || message.metadata?.assistantActivityEvents,
              normalizedEvents
            )
            liveAssistantActivityEvents = assistantActivityEvents
            return {
              assistantActivityEvents,
              metadata: mergeLiveMetadata(message.metadata, {
                assistantActivityEvents,
                assistantActivityCount: assistantActivityEvents.length,
                assistantActivityLastStage: assistantActivityEvents.at(-1)?.stage || null
              }),
              status: 'loading',
              error: '',
              retryable: false
            }
          })
        },
        onDone: (payload) => {
          streamState.receivedData = true
          finalMetadata = payload.metadata || null
        },
        onError: (_error, _payload, envelope) => {
          if (envelope) {
            streamState.receivedData = true
          }
        }
      })
    } catch (error) {
      error.receivedStreamData = streamState.receivedData
      throw error
    }

    if (!streamState.receivedData) {
      throw new Error('The legal research stream did not return data.')
    }

    const finalActivityEvents = mergeAssistantActivityEvents(
      liveAssistantActivityEvents,
      finalMetadata?.assistantActivityEvents || []
    )

    resolveAssistantMessage(chatId, assistantMessageId, finalContent, {
      requestId,
      assistantActivityEvents: finalActivityEvents,
      assistantConversationContext: finalMetadata?.assistantConversationContext || null,
      followups: finalMetadata?.assistantFollowups || [],
      metadata: mergeLiveMetadata(finalMetadata || {}, {
        assistantActivityEvents: finalActivityEvents.length
          ? finalActivityEvents
          : finalMetadata?.assistantActivityEvents,
        route: 'legal_research_stream'
      })
    })
  }

  const runRequest = async ({ chatId, content, sourceMessageId = null }) => {
    let activeRoute = 'chat'
    const requestId = createRequestId()
    const userMessageId =
      sourceMessageId || appendUserMessage(chatId, content, { requestId })
    const assistantMessageId = appendAssistantPlaceholder(chatId, requestId)

    const controller = new AbortController()
    abortControllerRef.current = controller
    setActiveRequest({
      chatId,
      requestId,
      assistantMessageId,
      userMessageId
    })

    try {
      const token = currentUser ? await currentUser.getIdToken() : null
      const previousAssistantContext = getLatestAssistantConversationContext(activeChat?.messages || [])
      const messages = (activeChat?.messages || [])
        .filter(
          (message) =>
            !['error', 'loading', 'cancelled'].includes(message.status) &&
            message.id !== assistantMessageId &&
            message.content
        )
        .concat(
          sourceMessageId
            ? []
            : [
                {
                  role: 'user',
                  content
                }
              ]
        )
        .map((message) => ({
          role: message.role,
          content: message.content
        }))

      const shouldUseStreaming =
        import.meta.env.VITE_ENABLE_SSE_CHAT === 'true' &&
        Boolean(token) &&
        typeof patchAssistantMessage === 'function'
      const route = getChatRouteForMessage(content, {
        sseEnabled: import.meta.env.VITE_ENABLE_SSE_CHAT === 'true',
        canPatch: typeof patchAssistantMessage === 'function',
        hasToken: Boolean(token)
      })
      activeRoute = route

      if (route === 'legal_stream' || route === 'legal_deep') {
        if (route === 'legal_deep') {
          await runLegalDeepRequest({
            assistantMessageId,
            chatId,
            content,
            requestId,
            signal: controller.signal,
            token,
            previousAssistantContext
          })
          return
        }

        try {
          await runLegalStreamingRequest({
            assistantMessageId,
            chatId,
            content,
            requestId,
            signal: controller.signal,
            token,
            previousAssistantContext
          })
        } catch (streamError) {
          if (!shouldRetryLegalDeepAfterStreamFailure(streamError)) {
            throw streamError
          }
          await runLegalDeepRequest({
            assistantMessageId,
            chatId,
            content,
            requestId,
            signal: controller.signal,
            token,
            previousAssistantContext
          })
        }
        return
      }

      if (!shouldUseStreaming) {
        await runFallbackRequest({
          assistantMessageId,
          chatId,
          content,
          messages,
          requestId,
          signal: controller.signal,
          token
        })
        return
      }

      try {
        await runStreamingRequest({
          assistantMessageId,
          chatId,
          content,
          messages,
          requestId,
          signal: controller.signal,
          token
        })
      } catch (streamError) {
        if (streamError?.name === 'AbortError' || streamError?.receivedStreamData) {
          throw streamError
        }
        await runFallbackRequest({
          assistantMessageId,
          chatId,
          content,
          messages,
          requestId,
          signal: controller.signal,
          token
        })
      }
    } catch (error) {
      if (error?.name === 'AbortError') {
        cancelAssistantMessage(chatId, assistantMessageId)
      } else {
        failAssistantMessage(chatId, assistantMessageId, getChatErrorMessage(error, {
          legalRoute: error?.legalResearchRoute === true || activeRoute === 'legal_stream' || activeRoute === 'legal_deep'
        }), {
          requestId
        })
      }
    } finally {
      abortControllerRef.current = null
      setActiveRequest(null)
    }
  }

  const sendMessage = async (chatId, content) => {
    if (activeRequest) return
    await runRequest({ chatId, content })
  }

  const retryMessage = async (chatId, userMessageId) => {
    if (activeRequest || !activeChat) return

    const userMessage = activeChat.messages.find((message) => message.id === userMessageId)
    if (!userMessage?.content) return

    await runRequest({
      chatId,
      content: userMessage.content,
      sourceMessageId: userMessage.id
    })
  }

  const regenerateLatestResponse = async (chatId) => {
    if (activeRequest || !activeChat) return

    const latestUserMessage = [...activeChat.messages]
      .reverse()
      .find((message) => message.role === 'user' && message.content)

    if (!latestUserMessage) return

    await runRequest({
      chatId,
      content: latestUserMessage.content,
      sourceMessageId: latestUserMessage.id
    })
  }

  const cancelActiveRequest = () => {
    abortControllerRef.current?.abort()
  }

  return {
    cancelActiveRequest,
    isRequestActive: Boolean(activeRequest),
    regenerateLatestResponse,
    sendMessage,
    retryMessage
  }
}
