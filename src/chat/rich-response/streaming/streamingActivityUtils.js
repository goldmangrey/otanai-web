import { normalizeSources } from '../parts/sources/sourceUtils.js'
import { getMessageRenderPhase } from './streamingRenderUtils.js'

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function cleanText(value, maxLength = 140) {
  const text = String(value || '').replace(/\s+/g, ' ').trim()
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text
}

export function activityToText(activity) {
  if (!activity) return ''
  if (typeof activity === 'string') return cleanText(activity)

  const source = asObject(activity)
  return cleanText(source.label || source.text || source.message || source.action || source.phase || source.type)
}

export function normalizeActivityItems(metadata = null) {
  const source = asObject(metadata)
  const candidates = [
    ...asArray(source.activity),
    ...asArray(source.activities),
    source.currentActivity
  ].filter(Boolean)

  return candidates
    .map((item, index) => ({
      id: cleanText(asObject(item).id || `activity-${index + 1}`, 80),
      text: activityToText(item),
      status: cleanText(asObject(item).status || (index === candidates.length - 1 ? 'current' : 'done'), 40)
    }))
    .filter((item) => item.text)
    .slice(-4)
}

export function getSourceCount(metadata = null) {
  const source = asObject(metadata)
  const explicit = Number(source.sourceCount || source.source_count)
  if (Number.isFinite(explicit) && explicit > 0) return explicit
  return normalizeSources(source).length
}

export function getQualitySummary(metadata = null) {
  const source = asObject(metadata)
  const quality = source.quality || source.qualityUpdate || source.quality_update
  if (!quality) return ''
  if (typeof quality === 'string') return cleanText(quality)

  const object = asObject(quality)
  return cleanText(
    object.summary ||
      object.message ||
      object.evidence_status ||
      object.evidenceStatus ||
      object.status
  )
}

export function getStreamingHeadline(message = null) {
  const metadata = asObject(message?.metadata)
  return cleanText(metadata.statusText || metadata.currentStatus || metadata.headline) || 'OtanAI формирует ответ...'
}

export function shouldShowStreamingActivity(message, options = {}) {
  return getMessageRenderPhase(message, options) === 'draft'
}

export function normalizeStreamingActivity(message = null) {
  const metadata = asObject(message?.metadata)
  const items = normalizeActivityItems(metadata)
  const sourceCount = getSourceCount(metadata)
  const quality = getQualitySummary(metadata)

  return {
    headline: getStreamingHeadline(message),
    items,
    sourceCount,
    quality
  }
}
