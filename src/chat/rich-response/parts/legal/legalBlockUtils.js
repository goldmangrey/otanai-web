import { PART_TYPES, normalizePartType } from '../../partTypes.js'
import { safeUrl } from '../../security/safeUrl.js'

export const LEGAL_PART_TYPES = new Set([
  PART_TYPES.LEGAL_CITATION,
  PART_TYPES.WARNING,
  PART_TYPES.RISK,
  PART_TYPES.CHECKLIST,
  PART_TYPES.TIMELINE,
  PART_TYPES.MISSING_INFO,
  PART_TYPES.SUGGESTED_ACTIONS,
  PART_TYPES.LEGAL_DISCLAIMER
])

export const DEFAULT_LEGAL_DISCLAIMER =
  'OtanAI даёт справочную правовую информацию по описанной ситуации. Для процессуальных действий и подачи документов рекомендуется проверить факты и документы с юристом.'

function isPlainObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value)
}

function firstPresentValue(source, keys) {
  if (!isPlainObject(source)) return undefined
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) return source[key]
  }
  return undefined
}

function compactText(value) {
  return valueToText(value).replace(/\s+/g, ' ').trim()
}

export function valueToText(value) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return value.map(valueToText).filter(Boolean).join(', ')

  if (isPlainObject(value)) {
    const displayValue = firstPresentValue(value, [
      'text',
      'value',
      'label',
      'title',
      'name',
      'message',
      'description'
    ])
    if (displayValue !== undefined) return valueToText(displayValue)

    try {
      return JSON.stringify(value)
    } catch {
      return ''
    }
  }

  return String(value ?? '')
}

export function canonicalLegalPartType(type) {
  const normalized = normalizePartType(type)
  return LEGAL_PART_TYPES.has(normalized) ? normalized : PART_TYPES.UNKNOWN
}

export function isLegalPartType(type) {
  return LEGAL_PART_TYPES.has(canonicalLegalPartType(type))
}

export function normalizeStatus(value) {
  const status = compactText(value).toLowerCase()
  if (['active', 'актуально', 'valid'].includes(status)) return 'active'
  if (['outdated', 'устарело', 'требует проверки'].includes(status)) return 'outdated'
  if (['draft', 'черновик'].includes(status)) return 'draft'
  return status || 'unknown'
}

export function normalizeBlockVariant(value) {
  const text = compactText(value).toLowerCase()
  if (['success', 'ok', 'готово'].includes(text)) return 'success'
  if (/danger|critical|критично|срочно|urgent/.test(text)) return 'danger'
  if (/warning|важно|important|alert/.test(text)) return 'warning'
  if (/info|note|заметка/.test(text)) return 'info'
  return 'warning'
}

export function normalizeRiskLevel(value) {
  const text = compactText(value).toLowerCase()
  if (/критично|danger|urgent|срочно/.test(text)) return 'danger'
  if (/высокий|высокая|high/.test(text)) return 'high'
  if (/средний|средняя|medium/.test(text)) return 'medium'
  if (/низкий|низкая|low/.test(text)) return 'low'
  return 'neutral'
}

export function normalizeLegalItems(items) {
  if (!items) return []

  const source = Array.isArray(items) ? items : [items]
  return source
    .map((item, index) => {
      if (isPlainObject(item)) {
        const text = compactText(firstPresentValue(item, ['text', 'label', 'title', 'message', 'description', 'value']))
        if (!text) return null
        return {
          title: compactText(firstPresentValue(item, ['title', 'label', 'name'])),
          text,
          checked: item.checked === true || item.done === true,
          hint: compactText(firstPresentValue(item, ['hint', 'note', 'description'])),
          level: normalizeRiskLevel(firstPresentValue(item, ['level', 'severity', 'risk']) ?? text),
          mitigation: compactText(firstPresentValue(item, ['mitigation', 'solution', 'recommendation'])),
          label: compactText(firstPresentValue(item, ['label', 'step'])) || `Шаг ${index + 1}`,
          date: compactText(firstPresentValue(item, ['date', 'deadline'])),
          status: normalizeTimelineStatus(firstPresentValue(item, ['status', 'state']))
        }
      }

      const text = compactText(item)
      return text ? { text, label: `Шаг ${index + 1}`, status: 'next', level: normalizeRiskLevel(text) } : null
    })
    .filter(Boolean)
}

export function normalizeLegalActions(actions) {
  if (!actions) return []

  const source = Array.isArray(actions) ? actions : [actions]
  return source
    .map((action) => {
      if (isPlainObject(action)) {
        const label = compactText(firstPresentValue(action, ['label', 'title', 'text', 'name']))
        if (!label) return null
        const value = compactText(firstPresentValue(action, ['value', 'action', 'id', 'type'])) || label
        const kind = compactText(action.kind).toLowerCase()
        return {
          label,
          value,
          kind: ['primary', 'secondary'].includes(kind) ? kind : 'secondary',
          disabled: action.disabled === true
        }
      }

      const label = compactText(action)
      return label ? { label, value: label, kind: 'secondary', disabled: false } : null
    })
    .filter(Boolean)
}

function normalizeTimelineStatus(value) {
  const text = compactText(value).toLowerCase()
  if (['done', 'выполнено'].includes(text)) return 'done'
  if (['current', 'сейчас'].includes(text)) return 'current'
  if (['blocked', 'требует данных'].includes(text)) return 'blocked'
  return 'next'
}

export function normalizeCitation(citation) {
  const source = isPlainObject(citation) ? citation : {}
  const title = compactText(firstPresentValue(source, ['title', 'name'])) || 'Правовой источник'
  const url = safeUrl(firstPresentValue(source, ['url', 'href', 'link']))

  return {
    title,
    article: compactText(source.article),
    section: compactText(source.section),
    code: compactText(source.code),
    jurisdiction: compactText(source.jurisdiction) || 'Казахстан',
    status: normalizeStatus(source.status),
    url,
    excerpt: compactText(firstPresentValue(source, ['excerpt', 'text', 'summary', 'description'])),
    usedFor: compactText(firstPresentValue(source, ['usedFor', 'used_for', 'purpose'])),
    updatedAt: compactText(firstPresentValue(source, ['updatedAt', 'updated_at', 'freshness']))
  }
}

export function normalizeLegalCitationPart(part) {
  const source = isPlainObject(part) ? part : {}
  const citation = normalizeCitation(source.citation || source)
  return {
    ...citation,
    id: compactText(source.id),
    type: PART_TYPES.LEGAL_CITATION
  }
}

export function normalizeWarningPart(part) {
  const source = isPlainObject(part) ? part : {}
  const text = compactText(firstPresentValue(source, ['text', 'message', 'content', 'description']))
  const variant = normalizeBlockVariant(firstPresentValue(source, ['variant', 'severity', 'level', 'type']) ?? text)
  return {
    id: compactText(source.id),
    type: PART_TYPES.WARNING,
    title: compactText(firstPresentValue(source, ['title', 'label'])) || (variant === 'danger' ? 'Внимание' : 'Важно'),
    text,
    items: normalizeLegalItems(source.items),
    variant
  }
}

export function normalizeRiskPart(part) {
  const source = isPlainObject(part) ? part : {}
  const text = compactText(firstPresentValue(source, ['text', 'message', 'content', 'description']))
  const items = normalizeLegalItems(source.items || source.risks)
  return {
    id: compactText(source.id),
    type: PART_TYPES.RISK,
    title: compactText(source.title) || 'Риски',
    level: normalizeRiskLevel(firstPresentValue(source, ['level', 'severity', 'risk']) ?? text),
    text,
    items
  }
}

export function normalizeChecklistPart(part) {
  const source = isPlainObject(part) ? part : {}
  return {
    id: compactText(source.id),
    type: PART_TYPES.CHECKLIST,
    title: compactText(source.title) || 'Что сделать дальше',
    items: normalizeLegalItems(source.items || source.steps || source.checklist)
  }
}

export function normalizeTimelinePart(part) {
  const source = isPlainObject(part) ? part : {}
  return {
    id: compactText(source.id),
    type: PART_TYPES.TIMELINE,
    title: compactText(source.title) || 'Порядок действий',
    items: normalizeLegalItems(source.items || source.steps || source.timeline).map((item, index) => ({
      ...item,
      title: item.title || item.text,
      label: item.label || `Шаг ${index + 1}`,
      status: normalizeTimelineStatus(item.status)
    }))
  }
}

export function normalizeMissingInfoPart(part) {
  const source = isPlainObject(part) ? part : {}
  return {
    id: compactText(source.id),
    type: PART_TYPES.MISSING_INFO,
    title: compactText(source.title) || 'Для точного ответа не хватает',
    items: normalizeLegalItems(source.items || source.fields || source.missing),
    questions: normalizeLegalActions(source.questions || source.chips)
  }
}

export function normalizeSuggestedActionsPart(part) {
  const source = isPlainObject(part) ? part : {}
  return {
    id: compactText(source.id),
    type: PART_TYPES.SUGGESTED_ACTIONS,
    title: compactText(source.title) || 'Следующий шаг',
    actions: normalizeLegalActions(source.actions || source.items)
  }
}

export function normalizeLegalDisclaimerPart(part) {
  const source = isPlainObject(part) ? part : {}
  return {
    id: compactText(source.id),
    type: PART_TYPES.LEGAL_DISCLAIMER,
    title: compactText(source.title) || 'Важно',
    text: compactText(firstPresentValue(source, ['text', 'message', 'content', 'description'])) || DEFAULT_LEGAL_DISCLAIMER,
    collapsed: source.collapsed !== false
  }
}

export function normalizeLegalPart(part) {
  const source = isPlainObject(part) ? part : {}
  const type = canonicalLegalPartType(source.type)

  switch (type) {
    case PART_TYPES.LEGAL_CITATION:
      return normalizeLegalCitationPart({ ...source, type })
    case PART_TYPES.WARNING:
      return normalizeWarningPart({ ...source, type })
    case PART_TYPES.RISK:
      return normalizeRiskPart({ ...source, type })
    case PART_TYPES.CHECKLIST:
      return normalizeChecklistPart({ ...source, type })
    case PART_TYPES.TIMELINE:
      return normalizeTimelinePart({ ...source, type })
    case PART_TYPES.MISSING_INFO:
      return normalizeMissingInfoPart({ ...source, type })
    case PART_TYPES.SUGGESTED_ACTIONS:
      return normalizeSuggestedActionsPart({ ...source, type })
    case PART_TYPES.LEGAL_DISCLAIMER:
      return normalizeLegalDisclaimerPart({ ...source, type })
    default:
      return null
  }
}

export function metadataBlockToLegalPart(block) {
  return normalizeLegalPart(block)
}
