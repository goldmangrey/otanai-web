const ALLOWED_STATUSES = new Set(['pending', 'running', 'done', 'skipped', 'warning', 'error'])
const TECHNICAL_EVENT_TYPES = new Set([
  'semantic_enrichment_done',
  'dry_run_ingestion_done',
  'qdrant_search_started',
  'qdrant_results_found',
  'report_section_ready'
])

const FORBIDDEN_VISIBLE_TERMS = [
  'chain of thought',
  'hidden reasoning',
  'raw prompt',
  'qdrant payload',
  'raw html',
  'api key',
  'secret',
  'traceback',
  'stack trace',
  'recordsMatched',
  'semantic extraction',
  'pack_metadata',
  'kz_article'
]

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function cleanText(value, maxLength = 180) {
  const text = String(value || '').replace(/\s+/g, ' ').trim()
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text
}

function containsForbiddenText(value) {
  const text = String(value || '').toLowerCase()
  return FORBIDDEN_VISIBLE_TERMS.some((term) => text.includes(term.toLowerCase()))
}

function normalizeStatus(value) {
  const status = String(value || '').trim().toLowerCase()
  if (status === 'complete' || status === 'completed' || status === 'success') return 'done'
  return ALLOWED_STATUSES.has(status) ? status : 'done'
}

function normalizeOrder(value, fallback) {
  const order = Number(value)
  return Number.isFinite(order) ? order : fallback
}

function getActivityPayload(input) {
  const source = asObject(input)
  const payload = asObject(source.payload)
  if (source.type === 'assistant_activity') return payload.stage ? payload : source
  if (payload.type === 'assistant_activity' || payload.stage) return payload
  return source.stage ? source : null
}

function isSafeToShow(source, payload) {
  if (source.safe_to_show === false || source.safeToShow === false) return false
  if (payload.safe_to_show === false || payload.safeToShow === false) return false
  return true
}

export function isForbiddenAssistantActivityText(text) {
  return containsForbiddenText(text)
}

export function normalizeAssistantActivityEvent(input, fallbackOrder = 0) {
  const source = asObject(input)
  const envelopeType = cleanText(source.type, 80)
  if (TECHNICAL_EVENT_TYPES.has(envelopeType)) return null

  const payload = getActivityPayload(source)
  if (!payload || typeof payload !== 'object') return null
  if (!isSafeToShow(source, payload)) return null

  const type = cleanText(payload.type || envelopeType || 'assistant_activity', 80)
  if (type !== 'assistant_activity') return null

  const stage = cleanText(payload.stage, 80)
  const message = cleanText(payload.message, 180)
  const detail = cleanText(payload.detail, 180)

  if (!stage || !message) return null
  if ([stage, message, detail].some(containsForbiddenText)) return null
  if (/^\{.*\}$/.test(message) || /^\{.*\}$/.test(detail)) return null

  return {
    type: 'assistant_activity',
    stage,
    message,
    status: normalizeStatus(payload.status),
    detail: detail || null,
    safe_to_show: true,
    safeToShow: true,
    order: normalizeOrder(payload.order, fallbackOrder),
    metadata: asObject(payload.metadata)
  }
}

export function normalizeAssistantActivityEvents(input) {
  const source = asObject(input)
  const candidates = Array.isArray(input)
    ? input
    : [
        ...asArray(source.assistantActivityEvents),
        ...asArray(source.metadata?.assistantActivityEvents),
        ...asArray(source.message?.assistantActivityEvents),
        ...asArray(source.message?.metadata?.assistantActivityEvents)
      ]

  return mergeAssistantActivityEvents([], candidates)
}

export function mergeAssistantActivityEvents(existing = [], incoming = []) {
  const byKey = new Map()
  const allEvents = [...asArray(existing), ...asArray(incoming)]

  allEvents.forEach((item, index) => {
    const event = normalizeAssistantActivityEvent(item, index + 1)
    if (!event) return
    const key = `${event.stage}:${event.order}`
    byKey.set(key, event)
  })

  return [...byKey.values()]
    .sort((left, right) => left.order - right.order || left.stage.localeCompare(right.stage))
    .slice(0, 24)
}

export function hasAssistantActivityEvents(input) {
  return normalizeAssistantActivityEvents(input).length > 0
}

export function getLatestAssistantActivity(events = []) {
  const normalized = normalizeAssistantActivityEvents(events)
  if (!normalized.length) return null

  return (
    [...normalized].reverse().find((event) => ['running', 'pending'].includes(event.status)) ||
    [...normalized].reverse().find((event) => event.status !== 'skipped') ||
    normalized.at(-1)
  )
}

export function getAssistantActivitySummary(metadata = null, events = []) {
  const source = asObject(metadata)
  const explicit = asArray(source.assistantActivityPublicSummary)
    .map((item) => cleanText(item, 80))
    .filter(Boolean)
    .filter((item) => !containsForbiddenText(item))
    .slice(0, 6)

  if (explicit.length) return explicit

  const normalized = normalizeAssistantActivityEvents(events.length ? events : source)
  if (!normalized.length) return []

  const hasSourceStep = normalized.some((event) =>
    ['decide_sources', 'qdrant_search', 'adilet_search', 'source_filtering', 'evidence_selection'].includes(event.stage)
  )
  return [
    'Понял вопрос',
    hasSourceStep ? 'Проверил источники' : '',
    'Сформировал ответ',
    'Проверил ответ'
  ].filter(Boolean)
}

export function getCompletedAssistantActivityLabel(metadata = null, events = []) {
  const summary = getAssistantActivitySummary(metadata, events)
  if (summary.some((item) => /источник|источники|нпа/i.test(item))) {
    return 'Проверено: источник, нормы и ответ'
  }
  return summary.length ? summary.slice(-2).join(' · ') : 'Готово'
}

