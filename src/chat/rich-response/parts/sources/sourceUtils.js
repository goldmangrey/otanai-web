import { PART_TYPES, normalizePartType } from '../../partTypes.js'
import { safeUrl } from '../../security/safeUrl.js'

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

export function valueToText(value) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return value.map(valueToText).filter(Boolean).join(', ')

  if (isPlainObject(value)) {
    const displayValue = firstPresentValue(value, [
      'title',
      'name',
      'label',
      'text',
      'value',
      'heading',
      'description',
      'summary'
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

function cleanText(value) {
  return valueToText(value).replace(/\s+/g, ' ').trim()
}

function collectSourceCandidates(input) {
  if (!input) return []
  if (Array.isArray(input)) return input

  const hasSourceFields = isPlainObject(input) && Boolean(
    firstPresentValue(input, ['title', 'name', 'label', 'url', 'href', 'link', 'source_url', 'sourceUrl', 'excerpt', 'snippet'])
  )

  if (isPlainObject(input) && Array.isArray(input.sources)) return input.sources
  if (isPlainObject(input) && Array.isArray(input.citations)) return input.citations
  if (hasSourceFields && !input.metadata) return [input]

  const metadata = isPlainObject(input.metadata) ? input.metadata : input
  const sourcePanel = metadata.sourcePanel || metadata.source_panel

  if (Array.isArray(sourcePanel)) return sourcePanel
  if (isPlainObject(sourcePanel) && Array.isArray(sourcePanel.sources)) return sourcePanel.sources

  const candidates = [
    metadata.sources,
    metadata.citations,
    metadata.references,
    input.sources,
    input.citations
  ]

  return candidates.find(Array.isArray) || []
}

export function canonicalSourceType(type) {
  const text = cleanText(type).toLowerCase()
  if (['law', 'legal', 'code', 'statute', 'npa', 'нпа'].includes(text)) return 'law'
  if (text === 'article') return 'article'
  if (['court', 'case', 'decision'].includes(text)) return 'case'
  if (['document', 'uploaded_document'].includes(text)) return 'document'
  if (['website', 'web'].includes(text)) return 'website'
  if (['database', 'registry'].includes(text)) return 'registry'
  return 'unknown'
}

export function canonicalSourceStatus(status) {
  const text = cleanText(status).toLowerCase()
  if (['active', 'актуально'].includes(text)) return 'active'
  if (['outdated', 'требует проверки'].includes(text)) return 'outdated'
  if (['draft', 'черновик'].includes(text)) return 'draft'
  if (['archived', 'архив'].includes(text)) return 'archived'
  return 'unknown'
}

export function canonicalFreshness(value) {
  const text = cleanText(value).toLowerCase()
  if (['checked', 'проверено'].includes(text)) return 'checked'
  if (['current', 'active', 'актуально'].includes(text)) return 'current'
  if (['stale', 'нужно проверить'].includes(text)) return 'stale'
  return 'unknown'
}

export function sourceTypeLabel(type) {
  return {
    law: 'НПА',
    article: 'Статья',
    case: 'Судебный акт',
    document: 'Документ',
    website: 'Веб-источник',
    registry: 'Реестр',
    unknown: 'Источник'
  }[canonicalSourceType(type)]
}

export function sourceStatusLabel(status) {
  return {
    active: 'Актуально',
    unknown: 'Не проверено',
    outdated: 'Требует проверки',
    draft: 'Черновик',
    archived: 'Архив'
  }[canonicalSourceStatus(status)]
}

export function sourceFreshnessLabel(freshness) {
  return {
    checked: 'Проверено',
    current: 'Актуально',
    unknown: 'Не проверено',
    stale: 'Нужно проверить'
  }[canonicalFreshness(freshness)]
}

export function sourceToUrl(source) {
  return safeUrl(firstPresentValue(source, ['url', 'href', 'link', 'source_url', 'sourceUrl']))
}

export function sourceToTitle(source, index = 0) {
  return cleanText(firstPresentValue(source, ['title', 'name', 'label', 'heading', 'document', 'law'])) || `Источник ${index + 1}`
}

export function sourceToExcerpt(source) {
  return cleanText(firstPresentValue(source, ['excerpt', 'snippet', 'quote', 'text', 'content', 'summary', 'description']))
}

export function sourceToType(source) {
  return canonicalSourceType(firstPresentValue(source, ['sourceType', 'source_type', 'type']))
}

export function sourceToStatus(source) {
  return canonicalSourceStatus(source?.status)
}

export function sourceToFreshness(source) {
  return canonicalFreshness(source?.freshness || source?.freshnessStatus)
}

export function sourceToUsedFor(source) {
  return cleanText(firstPresentValue(source, ['usedFor', 'used_for', 'purpose']))
}

export function sourceToScore(source) {
  const value = firstPresentValue(source, ['score', 'confidence'])
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

export function sourceToId(source, index = 0) {
  return cleanText(firstPresentValue(source, ['id', 'source_id', 'sourceId'])) || sourceToUrl(source) || `${sourceToTitle(source, index)}_${index + 1}`
}

export function normalizeSource(source, index = 0) {
  const input = isPlainObject(source) ? source : { title: source }
  const title = sourceToTitle(input, index)
  const url = sourceToUrl(input)
  const sourceType = sourceToType(input)
  const status = sourceToStatus(input)
  const freshness = sourceToFreshness(input)
  const excerpt = sourceToExcerpt(input)

  return {
    id: sourceToId(input, index),
    title,
    url,
    sourceType,
    code: cleanText(input.code),
    article: cleanText(input.article),
    section: cleanText(input.section),
    jurisdiction: cleanText(input.jurisdiction) || 'Казахстан',
    status,
    freshness,
    updatedAt: cleanText(input.updatedAt || input.updated_at || input.publishedAt || input.published_at),
    retrievedAt: cleanText(input.retrievedAt || input.retrieved_at),
    excerpt,
    usedFor: sourceToUsedFor(input),
    score: sourceToScore(input)
  }
}

function dedupeKey(source) {
  if (source.url) return `url:${source.url.toLowerCase()}`
  const title = source.title.toLowerCase()
  if (source.article) return `article:${title}:${source.article.toLowerCase()}`
  if (source.excerpt) return `excerpt:${title}:${source.excerpt.toLowerCase()}`
  return `title:${title}`
}

export function dedupeSources(sources = []) {
  const seen = new Set()
  const deduped = []

  sources.forEach((source) => {
    const key = dedupeKey(source)
    if (seen.has(key)) return
    seen.add(key)
    deduped.push(source)
  })

  return deduped
}

export function normalizeSources(input) {
  const candidates = collectSourceCandidates(input)
  return dedupeSources(candidates.map(normalizeSource).filter((source) => source.title || source.url || source.excerpt))
}

export function normalizeSourcePanelPart(part) {
  const source = isPlainObject(part) ? part : {}
  const sources = normalizeSources(source.sources || source)

  return {
    id: cleanText(source.id),
    type: PART_TYPES.SOURCE_PANEL,
    title: cleanText(source.title) || 'Источники',
    sources,
    metadata: isPlainObject(source.metadata) ? source.metadata : {}
  }
}

export function isSourcePanelPart(type) {
  return normalizePartType(type) === PART_TYPES.SOURCE_PANEL
}

export function metadataToSourcePanelPart(metadata) {
  const source = isPlainObject(metadata) ? metadata : {}
  const blocks = Array.isArray(source.blocks) ? source.blocks : []
  const parts = Array.isArray(source.parts) ? source.parts : []

  const panelLike = [...parts, ...blocks].find((item) => isSourcePanelPart(item?.type))
  if (panelLike) return normalizeSourcePanelPart(panelLike)

  const panel = source.sourcePanel || source.source_panel
  if (Array.isArray(panel)) return normalizeSourcePanelPart({ sources: panel })
  if (panel) return normalizeSourcePanelPart(panel)

  const sources = normalizeSources(source)
  return sources.length ? normalizeSourcePanelPart({ sources }) : null
}
