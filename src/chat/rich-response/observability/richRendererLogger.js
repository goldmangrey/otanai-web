import { shouldShowRichDebugPanel } from '../../../config/richResponseFlags.js'

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function sanitizeContext(context = {}) {
  const message = asObject(context.message)
  const metadata = asObject(message.metadata || context.metadata)
  const parts = Array.isArray(message.parts)
    ? message.parts
    : Array.isArray(metadata.parts)
      ? metadata.parts
      : []

  return {
    messageId: message.id || context.messageId || null,
    role: message.role || context.role || null,
    status: message.status || context.status || null,
    renderPhase: context.renderPhase || null,
    protocolVersion: metadata.protocolVersion || context.protocolVersion || null,
    partTypes: parts.map((part) => String(asObject(part).type || 'unknown')),
    source: context.source || null
  }
}

function shouldLog() {
  return Boolean((import.meta.env || {}).DEV) || shouldShowRichDebugPanel()
}

function log(level, label, error, context) {
  if (!shouldLog()) return
  const payload = {
    label,
    errorName: error?.name || 'Error',
    errorMessage: error?.message || String(error || ''),
    context: sanitizeContext(context)
  }
  const logger = console[level] || console.warn
  logger('[OtanAI rich renderer]', payload)
}

export function logRichRendererError(error, context = {}) {
  log('error', 'render_error', error, context)
}

export function logNormalizeMessageError(error, context = {}) {
  log('warn', 'normalize_error', error, context)
}

export function logPartRenderError(error, context = {}) {
  log('warn', 'part_render_error', error, context)
}

export function logStreamV4Error(error, context = {}) {
  log('warn', 'stream_v4_error', error, context)
}
