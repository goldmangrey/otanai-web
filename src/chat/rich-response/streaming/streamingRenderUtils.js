const DRAFT_STATUSES = new Set(['loading', 'streaming', 'generating', 'pending'])
const FINAL_STATUSES = new Set(['sent', 'complete', 'completed', 'done', 'success'])
const ERROR_STATUSES = new Set(['error', 'failed', 'cancelled', 'canceled', 'aborted'])

function statusOf(message) {
  return String(message?.status || '').trim().toLowerCase()
}

export function isMessageStreaming(message) {
  return DRAFT_STATUSES.has(statusOf(message))
}

export function isMessageFinal(message) {
  const status = statusOf(message)
  if (!status && message?.content) return true
  return FINAL_STATUSES.has(status)
}

export function isMessageErrored(message) {
  return ERROR_STATUSES.has(statusOf(message))
}

export function getMessageRenderPhase(message, options = {}) {
  const explicit = String(options.renderPhase || '').trim().toLowerCase()
  if (['draft', 'final', 'error'].includes(explicit)) return explicit
  if (options.isStreaming === true) return 'draft'
  if (isMessageErrored(message)) return 'error'
  if (isMessageStreaming(message)) return 'draft'
  return 'final'
}

export function shouldUseDraftNormalization(message, options = {}) {
  return getMessageRenderPhase(message, options) === 'draft'
}

export function shouldExtractDocumentFences(message, options = {}) {
  return getMessageRenderPhase(message, options) === 'final'
}

export function shouldRenderStructuredPartsDuringStream(message, options = {}) {
  if (getMessageRenderPhase(message, options) !== 'draft') return true
  return Array.isArray(message?.parts) && message.parts.length > 0
}

export function getStableStreamingText(text) {
  return String(text || '')
}

export function getFinalRenderKey(message) {
  const id = String(message?.id || message?.requestId || 'message')
  const status = statusOf(message) || 'final'
  const contentLength = String(message?.content || '').length
  const metadataStamp = JSON.stringify(message?.metadata || {}).length
  return `${id}:${status}:${contentLength}:${metadataStamp}`
}
