import { normalizeActivity } from './activity.js'

const GROUPS = [
  { id: 'planning', label: 'Планирование', phases: new Set(['budgeting', 'planning', 'routing']) },
  { id: 'retrieval', label: 'Поиск источников', phases: new Set(['retrieval', 'source_compilation', 'reading', 'follow_up']) },
  { id: 'coverage', label: 'Проверка покрытия', phases: new Set(['coverage', 'verification']) },
  { id: 'risks', label: 'Пробелы и риски', phases: new Set(['gap_analysis', 'conflict_check', 'warning']) },
  { id: 'quality', label: 'Качество ответа', phases: new Set(['quality']) },
  { id: 'synthesis', label: 'Формирование ответа', phases: new Set(['synthesis', 'done']) }
]

const HIDDEN_MARKERS = [
  'chain_of_thought',
  'hidden_reasoning',
  'private_reasoning',
  'raw_evidence',
  'system_prompt',
  'raw_prompt',
  'traceback',
  'stack trace',
  'api_key',
  'secret'
]

function cleanText(value, maxLength = 180) {
  const text = String(value || '').replace(/\s+/g, ' ').trim()
  const lowered = text.toLowerCase().replaceAll('-', '_')
  if (!text || HIDDEN_MARKERS.some((marker) => lowered.includes(marker))) return ''
  if (/^\{.*\}$/.test(text)) return ''
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text
}

function groupForPhase(phase, type) {
  const normalized = cleanText(phase || type, 80).toLowerCase()
  return GROUPS.find((group) => group.phases.has(normalized)) || null
}

function groupStatus(items) {
  if (items.some((item) => item.status === 'error')) return 'error'
  if (items.some((item) => item.status === 'warning')) return 'warning'
  if (items.some((item) => item.status === 'running')) return 'running'
  if (items.some((item) => item.status === 'pending')) return 'running'
  return 'done'
}

function sanitizeItem(item, sequence) {
  const label = cleanText(item?.label, 140)
  if (!label) return null
  return {
    ...item,
    id: cleanText(item.id || `${sequence}-${label}`, 120),
    label,
    detail: cleanText(item.detail, 220),
    phase: cleanText(item.phase, 80).toLowerCase(),
    status: cleanText(item.status, 40).toLowerCase() || 'done',
    ts: Number.isFinite(Number(item.ts)) ? Number(item.ts) : sequence
  }
}

export function groupResearchActivity(activityOrMetadata, metadata = null) {
  const activity = Array.isArray(activityOrMetadata)
    ? activityOrMetadata
    : normalizeActivity(activityOrMetadata)
  const source = metadata || (Array.isArray(activityOrMetadata) ? null : activityOrMetadata)
  const normalized = activity
    .map((item, index) => sanitizeItem(item, index))
    .filter(Boolean)
    .sort((a, b) => {
      const left = Number.isFinite(Number(a.ts)) ? Number(a.ts) : 0
      const right = Number.isFinite(Number(b.ts)) ? Number(b.ts) : 0
      return left - right
    })

  const buckets = new Map(GROUPS.map((group) => [group.id, { ...group, items: [] }]))
  for (const item of normalized) {
    const group = groupForPhase(item.phase, item.type)
    if (!group) continue
    buckets.get(group.id).items.push(item)
  }

  const groups = GROUPS
    .map((group) => buckets.get(group.id))
    .filter((group) => group.items.length)
    .map((group) => ({
      id: group.id,
      label: group.label,
      count: group.items.length,
      status: groupStatus(group.items),
      items: group.items
    }))

  const sourceSelection = source?.sourceSelection || source?.metadata?.sourceSelection
  if (sourceSelection && typeof sourceSelection === 'object') {
    const retrieval = groups.find((group) => group.id === 'retrieval')
    if (retrieval && !retrieval.summary) {
      retrieval.summary = {
        reviewed: Number(sourceSelection.reviewed_count || 0),
        used: Number(sourceSelection.used_count || 0),
        cited: Number(sourceSelection.cited_count || 0),
        official: Number(sourceSelection.official_count || 0)
      }
    }
  }

  return groups
}
