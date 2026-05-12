const ALLOWED_TYPES = new Set(['clarify', 'next_step', 'draft', 'source_lookup', 'practical'])
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
  'recordsmatched',
  'semantic extraction',
  'pack_metadata',
  'kz_article',
  'вы точно выиграете'
]

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function cleanText(value, maxLength = 160) {
  const text = String(value || '').replace(/\s+/g, ' ').trim()
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text
}

function containsForbiddenText(value) {
  const text = String(value || '').toLowerCase()
  return FORBIDDEN_VISIBLE_TERMS.some((term) => text.includes(term))
}

function normalizeType(value) {
  const type = String(value || '').trim().toLowerCase()
  return ALLOWED_TYPES.has(type) ? type : 'practical'
}

export function normalizeFollowupSuggestion(input, fallbackPriority = 100) {
  const item = asObject(input)
  if (item.safe_to_show === false || item.safeToShow === false) return null

  const label = cleanText(item.label, 80)
  const query = cleanText(item.query || item.label, 160)
  if (!label || !query) return null
  if (containsForbiddenText(label) || containsForbiddenText(query)) return null
  if (/^\{.*\}$/.test(label) || /^\{.*\}$/.test(query)) return null

  const priority = Number(item.priority)
  return {
    label,
    query,
    type: normalizeType(item.type),
    priority: Number.isFinite(priority) ? priority : fallbackPriority,
    safe_to_show: true
  }
}

export function normalizeFollowupSuggestions(input) {
  const source = asObject(input)
  const candidates = Array.isArray(input)
    ? input
    : [
        ...asArray(source.followups),
        ...asArray(source.assistantFollowups),
        ...asArray(source.metadata?.assistantFollowups),
        ...asArray(source.message?.followups),
        ...asArray(source.message?.metadata?.assistantFollowups)
      ]

  const seen = new Set()
  const normalized = []
  candidates.forEach((candidate, index) => {
    const item = normalizeFollowupSuggestion(candidate, index + 100)
    if (!item) return
    const key = `${item.label}:${item.query}`.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    normalized.push(item)
  })

  return normalized
    .sort((left, right) => left.priority - right.priority || left.label.localeCompare(right.label))
    .slice(0, 5)
}

export function hasFollowupSuggestions(input) {
  return normalizeFollowupSuggestions(input).length > 0
}

