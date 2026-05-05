import { getRichResponseFlags } from '../../../config/richResponseFlags.js'
import { getMessageRenderPhase } from '../streaming/streamingRenderUtils.js'

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

export function getPartSource(message) {
  const source = asObject(message)
  const metadata = asObject(source.metadata)
  if (Array.isArray(source.parts) && source.parts.length) return 'message.parts'
  if (Array.isArray(metadata.parts) && metadata.parts.length) return 'metadata.parts'
  if (Array.isArray(metadata.blocks) && metadata.blocks.length) return 'metadata.blocks'
  if (String(source.content || '').trim()) return 'legacy content'
  return 'none'
}

export function getDebugPartTypes(message) {
  const source = asObject(message)
  const metadata = asObject(source.metadata)
  const parts = Array.isArray(source.parts) && source.parts.length
    ? source.parts
    : Array.isArray(metadata.parts) && metadata.parts.length
      ? metadata.parts
      : []

  if (parts.length) return parts.map((part) => String(asObject(part).type || 'unknown'))
  if (Array.isArray(metadata.blocks) && metadata.blocks.length) {
    return metadata.blocks.map((block) => String(asObject(block).type || 'block'))
  }
  return String(source.content || '').trim() ? ['markdown'] : []
}

export function buildRichDebugSummary(message, options = {}) {
  const flags = options.flags || getRichResponseFlags()
  const partTypes = getDebugPartTypes(message)
  const phase = options.renderPhase || getMessageRenderPhase(message, options)
  return {
    richRenderer: Boolean(flags.richRenderer),
    streamProtocolV4: Boolean(flags.streamProtocolV4),
    designMode: Boolean(flags.designMode),
    playground: Boolean(flags.playground),
    debugPanel: Boolean(flags.debugPanel),
    inlineSources: Boolean(options.renderSourcePanel ?? flags.inlineSources),
    fallback: Boolean(options.fallback),
    renderPhase: phase,
    status: asObject(message).status || 'unknown',
    partSource: getPartSource(message),
    partsCount: partTypes.length,
    partTypes
  }
}

export function shouldRenderRichDebugBadge(message, options = {}) {
  if (asObject(message).role === 'user') return false
  if (options.forceVisible === true) return true
  return Boolean(options.debugEnabled)
}
