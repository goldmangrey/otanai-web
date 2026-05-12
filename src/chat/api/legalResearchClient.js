import { sendStreamingChatRequest } from './streamChatClient.js'

export const LEGAL_RESEARCH_STREAM_ENDPOINT = '/v1/legal/research/stream'
export const LEGAL_RESEARCH_DEEP_ENDPOINT = '/v1/legal/research/deep'

export const LEGAL_RESEARCH_PAYLOAD_DEFAULTS = {
  sourceMode: 'auto',
  useQdrantRetrieval: true,
  preferQdrantOverLocalPacks: true,
  qdrantLimit: 12,
  allowLiveAdilet: false,
  humanAnswerStyle: true,
  includeEvents: true
}

function normalizeBaseUrl(apiBaseUrl) {
  const normalized = apiBaseUrl?.replace(/\/$/, '')
  if (!normalized) {
    throw new Error('Missing VITE_API_BASE_URL for legal research backend.')
  }
  return normalized
}

export function buildLegalResearchPayload(message, options = {}) {
  const previousAssistantContext = options?.previousAssistantContext || null
  return {
    query: message,
    ...LEGAL_RESEARCH_PAYLOAD_DEFAULTS,
    includeCollisions: true,
    includeAmendments: true,
    includeComparativeLaw: false,
    includeGraph: true,
    streamChunks: true,
    ...(previousAssistantContext ? { previousAssistantContext } : {})
  }
}

export async function sendLegalResearchStreamRequest({
  apiBaseUrl,
  message,
  signal,
  token,
  onChunk,
  onDone,
  onError,
  onEvent,
  onAssistantActivity,
  previousAssistantContext
}) {
  return sendStreamingChatRequest({
    apiBaseUrl,
    endpointPath: LEGAL_RESEARCH_STREAM_ENDPOINT,
    token,
    signal,
    payload: buildLegalResearchPayload(message, { previousAssistantContext }),
    onChunk,
    onDone,
    onError,
    onEvent,
    onAssistantActivity
  })
}

export async function sendLegalResearchDeepRequest({ apiBaseUrl, message, signal, token, previousAssistantContext = null }) {
  const normalizedBaseUrl = normalizeBaseUrl(apiBaseUrl)
  const response = await fetch(`${normalizedBaseUrl}${LEGAL_RESEARCH_DEEP_ENDPOINT}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(buildLegalResearchPayload(message, { previousAssistantContext })),
    signal
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    throw new Error(data?.detail || data?.error || data?.message || 'The legal research request failed.')
  }

  const assistantText = data?.reportMarkdown
  if (!assistantText || typeof assistantText !== 'string') {
    throw new Error('Backend returned an invalid legal research response.')
  }

  return {
    assistantText,
    metadata: data?.metadata || null,
    sourceTrace: data?.sourceTrace || [],
    followups: Array.isArray(data?.followups) ? data.followups : [],
    assistantConversationContext: data?.metadata?.assistantConversationContext || null
  }
}
