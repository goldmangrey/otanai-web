const KNOWN_EVENT_TYPES = new Set([
  'meta',
  'activity',
  'source_found',
  'quality_update',
  'chunk',
  'done',
  'error'
])

function normalizeBaseUrl(apiBaseUrl) {
  const normalized = apiBaseUrl?.replace(/\/$/, '')
  if (!normalized) {
    throw new Error('Missing VITE_API_BASE_URL for chat backend.')
  }
  return normalized
}

function safeErrorMessage(error) {
  if (error?.name === 'AbortError') return 'Generation stopped.'
  if (error instanceof Error && error.message) return error.message
  return 'The streaming request failed.'
}

export function parseSseBuffer(buffer, onEnvelope) {
  const normalized = String(buffer || '').replace(/\r\n/g, '\n')
  const parts = normalized.split('\n\n')
  const remainder = parts.pop() || ''

  for (const part of parts) {
    const dataLines = part
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.replace(/^data:\s?/, ''))

    if (!dataLines.length) continue

    try {
      const envelope = JSON.parse(dataLines.join('\n'))
      onEnvelope(envelope)
    } catch {
      // Malformed SSE data is ignored so one bad envelope does not break the UI.
    }
  }

  return remainder
}

export async function readSseStream(response, onEnvelope, signal) {
  if (!response.body?.getReader) {
    throw new Error('Streaming is not supported by this browser.')
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      buffer = parseSseBuffer(buffer, onEnvelope)
    }

    buffer += decoder.decode()
    parseSseBuffer(`${buffer}\n\n`, onEnvelope)
  } finally {
    reader.releaseLock()
  }
}

function dispatchEnvelope(envelope, callbacks) {
  if (!envelope || typeof envelope !== 'object') return
  const type = String(envelope.type || '')
  if (!KNOWN_EVENT_TYPES.has(type)) return

  const payload = envelope.payload && typeof envelope.payload === 'object' ? envelope.payload : {}

  switch (type) {
    case 'meta':
      callbacks.onMeta?.(payload, envelope)
      break
    case 'activity':
      callbacks.onActivity?.(payload, envelope)
      break
    case 'source_found':
      callbacks.onSourceFound?.(payload, envelope)
      break
    case 'quality_update':
      callbacks.onQualityUpdate?.(payload, envelope)
      break
    case 'chunk':
      callbacks.onChunk?.(String(payload.delta || ''), payload, envelope)
      break
    case 'done':
      callbacks.onDone?.(payload, envelope)
      break
    case 'error':
      callbacks.onError?.(new Error(String(payload.message || 'The streaming request failed.')), payload, envelope)
      break
    default:
      break
  }
}

export async function sendStreamingChatRequest({
  apiBaseUrl,
  token,
  payload,
  signal,
  onMeta,
  onActivity,
  onSourceFound,
  onQualityUpdate,
  onChunk,
  onDone,
  onError
}) {
  const normalizedBaseUrl = normalizeBaseUrl(apiBaseUrl)
  const callbacks = {
    onMeta,
    onActivity,
    onSourceFound,
    onQualityUpdate,
    onChunk,
    onDone,
    onError
  }

  try {
    const response = await fetch(`${normalizedBaseUrl}/v1/stream-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        ...payload,
        protocolVersion: 3
      }),
      signal
    })

    if (!response.ok) {
      throw new Error('The streaming request failed.')
    }

    await readSseStream(response, (envelope) => dispatchEnvelope(envelope, callbacks), signal)
  } catch (error) {
    if (error?.name === 'AbortError') throw error
    const safeError = new Error(safeErrorMessage(error))
    onError?.(safeError)
    throw safeError
  }
}
