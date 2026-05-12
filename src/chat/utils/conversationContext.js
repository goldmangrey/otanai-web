const ALLOWED_CONFIDENCE = new Set(['high', 'medium', 'low'])
const FORBIDDEN_CONTEXT_TERMS = [
  'raw',
  'qdrant payload',
  'raw html',
  'article_text',
  'recordsMatched',
  'traceback',
  'stack trace',
  'secret',
  'api key',
  'chain of thought',
  'hidden reasoning'
]

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function cleanText(value, maxLength = 160) {
  const text = String(value || '').replace(/\s+/g, ' ').trim()
  return text.length > maxLength ? text.slice(0, maxLength).trim() : text
}

function isUnsafe(value) {
  const text = String(value || '').toLowerCase()
  return FORBIDDEN_CONTEXT_TERMS.some((term) => text.includes(term.toLowerCase()))
}

function safeString(value, maxLength = 160) {
  const text = cleanText(value, maxLength)
  return text && !isUnsafe(text) ? text : null
}

function safeStringArray(value, maxLength = 160, maxItems = 5) {
  const seen = new Set()
  const output = []
  for (const item of asArray(value)) {
    const text = safeString(item, maxLength)
    const key = text?.toLowerCase()
    if (!text || seen.has(key)) continue
    seen.add(key)
    output.push(text)
    if (output.length >= maxItems) break
  }
  return output
}

export function normalizeAssistantConversationContext(input) {
  const source = asObject(input)
  if (!Object.keys(source).length) return null

  const context = {
    last_intent: safeString(source.last_intent || source.lastIntent, 60),
    last_domain: safeString(source.last_domain || source.lastDomain, 40),
    last_strategy_type: safeString(source.last_strategy_type || source.lastStrategyType, 60),
    last_jurisdiction: safeString(source.last_jurisdiction || source.lastJurisdiction, 20),
    last_source_titles: safeStringArray(source.last_source_titles || source.lastSourceTitles),
    last_source_urls: safeStringArray(source.last_source_urls || source.lastSourceUrls, 220),
    last_adilet_doc_ids: safeStringArray(source.last_adilet_doc_ids || source.lastAdiletDocIds, 120),
    last_user_problem: safeString(source.last_user_problem || source.lastUserProblem, 80),
    active_topics: safeStringArray(source.active_topics || source.activeTopics, 80, 8),
    followup_origin: safeString(source.followup_origin || source.followupOrigin, 80),
    turns_tracked: Number.isFinite(Number(source.turns_tracked || source.turnsTracked))
      ? Number(source.turns_tracked || source.turnsTracked)
      : 0,
    confidence: ALLOWED_CONFIDENCE.has(source.confidence) ? source.confidence : 'low'
  }

  if (!context.last_domain && !context.last_intent && !context.active_topics.length) return null
  return context
}

export function getMessageConversationContext(message = null) {
  const metadata = asObject(message?.metadata)
  return normalizeAssistantConversationContext(
    message?.assistantConversationContext || metadata.assistantConversationContext
  )
}

export function getLatestAssistantConversationContext(messages = []) {
  const candidates = [...asArray(messages)].reverse()
  for (const message of candidates) {
    if (message?.role !== 'assistant') continue
    if (['error', 'loading', 'cancelled'].includes(message.status)) continue
    const context = getMessageConversationContext(message)
    if (context) return context
  }
  return null
}

