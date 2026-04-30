const ALLOWED_TYPES = new Set([
  'routing',
  'retrieval',
  'reading',
  'verification',
  'synthesis',
  'fallback',
  'done',
  'warning'
])

const ALLOWED_STATUSES = new Set(['pending', 'running', 'done', 'skipped', 'warning', 'error'])
const RESEARCH_PHASES = new Set([
  'planning',
  'retrieval',
  'reading',
  'source_compilation',
  'verification',
  'gap_analysis',
  'conflict_check',
  'follow_up'
])
const GENERIC_PHASES = new Set(['routing', 'synthesis', 'done'])
const LIVE_RESEARCH_PHASES = new Set([
  'planning',
  'retrieval',
  'reading',
  'source_compilation',
  'verification',
  'gap_analysis',
  'conflict_check',
  'follow_up',
  'synthesis'
])
const DEEP_RESEARCH_MODES = new Set(['deep_research', 'deep-research'])
const VERIFICATION_MODES = new Set(['auto_rag', 'auto-rag', 'grounded_rag', 'grounded-rag', 'grounded', 'rag'])
const HIDDEN_KEYS = new Set([
  'chain_of_thought',
  'chainOfThought',
  'hidden_reasoning',
  'hiddenReasoning',
  'private_reasoning',
  'privateReasoning',
  'raw_evidence',
  'rawEvidence',
  'prompt'
])

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function compactText(value, maxLength = 180) {
  const text = String(value || '').replace(/\s+/g, ' ').trim()
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text
}

function hasHiddenMarker(value) {
  const text = String(value || '').toLowerCase()
  return [...HIDDEN_KEYS].some((key) => text.includes(key.toLowerCase()))
}

function normalizeType(value) {
  const type = String(value || '').trim().toLowerCase()
  return ALLOWED_TYPES.has(type) ? type : 'done'
}

function normalizeStatus(value) {
  const status = String(value || '').trim().toLowerCase()
  if (status === 'completed' || status === 'complete' || status === 'success') return 'done'
  return ALLOWED_STATUSES.has(status) ? status : 'done'
}

function normalizeDomains(value) {
  return asArray(value)
    .map((item) => compactText(item, 60).toLowerCase())
    .filter(Boolean)
    .filter((item, index, array) => array.indexOf(item) === index)
    .slice(0, 5)
}

function normalizeSourceIds(value) {
  return asArray(value)
    .map((item) => compactText(item, 80))
    .filter(Boolean)
    .filter((item, index, array) => array.indexOf(item) === index)
    .slice(0, 12)
}

function normalizeMetrics(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  return Object.fromEntries(
    Object.entries(value)
      .map(([key, item]) => [compactText(key, 40), item])
      .filter(([key, item]) => {
        const type = typeof item
        return key && (type === 'string' || type === 'number' || type === 'boolean')
      })
      .slice(0, 8)
  )
}

function fromResearchLogStep(step) {
  const phase = compactText(step?.phase, 60)
  const action = compactText(step?.action, 120)
  const detail = compactText(step?.reason_summary || step?.reasonSummary || '', 180)

  return {
    type: phaseToType(phase),
    mode: compactText(step?.mode || 'deep_research', 40),
    phase: phase || 'done',
    label: action || phase || 'Выполняю исследовательский шаг',
    detail,
    status: normalizeStatus(step?.status),
    source_domains: normalizeDomains(step?.source_domains || step?.sourceDomains),
    domains: normalizeDomains(step?.domains || step?.source_domains || step?.sourceDomains),
    source_ids: normalizeSourceIds(step?.source_ids || step?.sourceIds),
    metrics: normalizeMetrics(step?.metrics),
    ts: null
  }
}

function phaseToType(phase) {
  const value = String(phase || '').toLowerCase()
  if (value.includes('policy') || value.includes('plan')) return 'routing'
  if (value.includes('search') || value.includes('retrieval')) return 'retrieval'
  if (value.includes('evidence') || value.includes('extract')) return 'reading'
  if (value.includes('gap') || value.includes('conflict') || value.includes('verification')) {
    return 'verification'
  }
  if (value.includes('synthesis') || value.includes('report')) return 'synthesis'
  return 'done'
}

function safeActivityItem(item, index) {
  if (!item || typeof item !== 'object') return null
  if (Object.keys(item).some((key) => HIDDEN_KEYS.has(key))) {
    return null
  }

  const label = compactText(item.label || item.action || item.phase, 120)
  if (!label) return null

  return {
    id: compactText(item.id || item.step_id || item.stepId || `${index}-${label}`, 120),
    type: normalizeType(item.type || phaseToType(item.phase)),
    mode: compactText(item.mode || '', 40).toLowerCase(),
    phase: compactText(item.phase || item.type || '', 60).toLowerCase(),
    label,
    detail: compactText(item.detail || item.reason_summary || item.reasonSummary || '', 180),
    status: normalizeStatus(item.status),
    source_domains: normalizeDomains(item.source_domains || item.sourceDomains || item.domains),
    domains: normalizeDomains(item.domains || item.source_domains || item.sourceDomains),
    source_ids: normalizeSourceIds(item.source_ids || item.sourceIds),
    metrics: normalizeMetrics(item.metrics),
    ts: Number.isFinite(Number(item.ts)) ? Number(item.ts) : null
  }
}

export function normalizeActivity(input) {
  const candidates = [
    ...asArray(input?.activity),
    ...asArray(input?.metadata?.activity),
    ...asArray(input?.message?.activity),
    ...asArray(input?.researchLog).map(fromResearchLogStep),
    ...asArray(input?.metadata?.researchLog).map(fromResearchLogStep),
    ...asArray(input?.message?.metadata?.researchLog).map(fromResearchLogStep)
  ]

  const seen = new Set()
  const normalized = []
  for (const candidate of candidates) {
    const item = safeActivityItem(candidate, normalized.length)
    if (!item) continue
    const key = `${item.type}:${item.label}:${item.detail}`
    if (seen.has(key)) continue
    seen.add(key)
    normalized.push(item)
    if (normalized.length >= 10) break
  }

  return normalized
}

function metadataMode(metadata) {
  const explicit = compactText(metadata?.activityMode || metadata?.mode || metadata?.metadata?.activityMode, 40)
    .toLowerCase()
  if (explicit === 'verification') return 'grounded_rag'
  if (explicit) return explicit
  const autoRag = metadata?.autoRag || metadata?.metadata?.autoRag
  if (autoRag?.enabled) return 'auto_rag'
  return ''
}

function activityModes(activity) {
  return activity.map((item) => item.mode).filter(Boolean)
}

function activityPhases(activity) {
  return activity.map((item) => item.phase || item.type).filter(Boolean)
}

export function shouldShowResearchActivity(activity, metadata = null) {
  const items = Array.isArray(activity) ? activity : normalizeActivity(metadata)
  if (!items.length || items.length < 3) return false

  const modes = new Set([metadataMode(metadata), ...activityModes(items)].filter(Boolean))
  if (modes.has('chat')) return false

  const phases = new Set(activityPhases(items))
  const hasResearchPhase = [...phases].some((phase) => RESEARCH_PHASES.has(phase))
  if (!hasResearchPhase) return false
  if ([...phases].every((phase) => GENERIC_PHASES.has(phase))) return false

  const hasDeepMode = [...modes].some((mode) => DEEP_RESEARCH_MODES.has(mode))
  const hasVerificationMode = [...modes].some((mode) => VERIFICATION_MODES.has(mode))
  const hasVerificationPhase = ['retrieval', 'source_compilation', 'verification'].some((phase) => phases.has(phase))
  const hasDeepPhase = ['planning', 'retrieval', 'gap_analysis', 'conflict_check', 'follow_up', 'synthesis'].some((phase) =>
    phases.has(phase)
  )

  return (hasDeepMode && hasDeepPhase) || (hasVerificationMode && hasVerificationPhase) || hasVerificationPhase
}

export function getActivityDisplayLabel(activity, metadata = null) {
  const items = Array.isArray(activity) ? activity : normalizeActivity(metadata)
  const explicit = compactText(metadata?.activityLabel || metadata?.metadata?.activityLabel, 80)
  if (explicit) return explicit

  const modes = new Set([metadataMode(metadata), ...activityModes(items)].filter(Boolean))
  if ([...modes].some((mode) => DEEP_RESEARCH_MODES.has(mode))) return 'Ход исследования'
  return 'Ход проверки'
}

export function getLatestLiveActivity(activity, metadata = null) {
  const items = Array.isArray(activity) ? activity : normalizeActivity(metadata)
  if (!items.length) return null

  const modes = new Set([metadataMode(metadata), ...activityModes(items)].filter(Boolean))
  const hasResearchMode = [...modes].some(
    (mode) => DEEP_RESEARCH_MODES.has(mode) || VERIFICATION_MODES.has(mode)
  )
  const hasResearchPhase = activityPhases(items).some((phase) => LIVE_RESEARCH_PHASES.has(phase))
  if (!hasResearchMode && !hasResearchPhase) return null
  if (modes.has('chat') && !hasResearchPhase) return null

  const candidates = items.filter((item) => {
    if (!item.label || hasHiddenMarker(item.label) || hasHiddenMarker(item.detail)) return false
    if (!LIVE_RESEARCH_PHASES.has(item.phase || item.type)) return false
    if ((item.phase || item.type) === 'synthesis' && !hasResearchMode) return false
    if (item.mode === 'chat' && !hasResearchMode) return false
    return ['running', 'pending', 'done', 'warning'].includes(item.status)
  })

  return [...candidates].reverse().find((item) => ['running', 'pending'].includes(item.status)) || candidates.at(-1) || null
}

export function getLiveActivityText(activityItem) {
  if (!activityItem || typeof activityItem !== 'object') return ''
  const label = compactText(activityItem.label, 140)
  if (!label || hasHiddenMarker(label)) return ''
  if (/^\{.*\}$/.test(label) || /^traceback/i.test(label) || /^stack trace/i.test(label)) return ''
  return label.endsWith('...') || label.endsWith('…') ? label : `${label}…`
}

export function getLiveActivityDetail(activityItem) {
  if (!activityItem || typeof activityItem !== 'object') return ''
  const detail = compactText(activityItem.detail, 150)
  if (!detail || hasHiddenMarker(detail)) return ''
  if (/^\{.*\}$/.test(detail) || /^traceback/i.test(detail) || /^stack trace/i.test(detail)) return ''
  return detail
}

export function shouldShowCurrentResearchStatus(metadata, messageStatus) {
  if (messageStatus !== 'loading') return false
  return Boolean(getLatestLiveActivity(normalizeActivity(metadata), metadata))
}

export function createPendingActivity() {
  return []
}
