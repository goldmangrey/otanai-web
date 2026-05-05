import { PART_TYPES } from '../partTypes.js'

const DOCUMENT_FENCE_LANGUAGES = new Set(['document', 'doc', 'template'])
const CONTENT_COLLAPSE_LIMIT = 1000

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
    const displayValue = firstPresentValue(value, ['value', 'label', 'text', 'title', 'name'])
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
  return valueToText(value).trim()
}

function normalizeLanguage(language) {
  return String(language || '').trim().toLowerCase()
}

export function isDocumentFenceLanguage(language = '') {
  return DOCUMENT_FENCE_LANGUAGES.has(normalizeLanguage(language))
}

export function parseDocumentFences(markdown, options = {}) {
  const text = String(markdown ?? '')
  if (!text) return []

  const fences = []
  const fencePattern = /(^|\n)([ \t]*)```([^\n`]*)\n([\s\S]*?)\n[ \t]*```(?=\n|$)/g
  let match

  while ((match = fencePattern.exec(text)) !== null) {
    const language = normalizeLanguage(String(match[3] || '').split(/\s+/)[0])
    if (!isDocumentFenceLanguage(language)) continue

    const prefixLength = match[1] ? match[1].length : 0
    const start = match.index + prefixLength
    const raw = match[0].slice(prefixLength)
    const content = String(match[4] ?? '').replace(/\n$/, '')

    if (!content.trim()) continue

    fences.push({
      id: `document_fence_${fences.length + 1}`,
      language,
      content,
      raw,
      start,
      end: start + raw.length,
      metadata: options.metadata || null
    })
  }

  return fences
}

export function inferDocumentKind(content, language = '', metadata = null) {
  const explicitKind = cleanText(firstPresentValue(metadata, ['kind', 'type', 'documentKind', 'document_kind']))
  if (explicitKind) return explicitKind

  const text = `${language} ${content}`.toLowerCase()
  if (/исковое заявление|(^|\s)иск(\s|$)/i.test(text)) return 'lawsuit'
  if (/претензия/i.test(text)) return 'claim'
  if (/заявление/i.test(text)) return 'application'
  if (/жалоба/i.test(text)) return 'complaint'
  if (/договор/i.test(text)) return 'contract'
  if (/уведомление/i.test(text)) return 'notice'
  return 'document'
}

export function inferDocumentLanguage(content, metadata = null) {
  const explicitLanguage = cleanText(firstPresentValue(metadata, ['language', 'lang']))
  if (explicitLanguage) return explicitLanguage.toLowerCase()

  const text = String(content || '')
  if (/[әғқңөұүһіӘҒҚҢӨҰҮҺІ]/.test(text)) return 'kk'
  return 'ru'
}

export function inferDocumentTitle(content, metadata = null) {
  const explicitTitle = cleanText(firstPresentValue(metadata, ['title', 'name', 'fileName', 'filename']))
  if (explicitTitle) return explicitTitle

  const lines = String(content || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const formalTitle = lines.find((line) =>
    /^(претензия|заявление|исковое заявление|иск|жалоба|договор|уведомление|шаблон|обращение|расписка|доверенность)$/i.test(line)
  )

  if (formalTitle) return formalTitle
  const firstLine = lines.find((line) => line.length <= 120)
  return firstLine || 'Документ'
}

export function normalizeDocumentFields(fields) {
  if (!fields) return []

  if (Array.isArray(fields)) {
    return fields
      .map((field, index) => {
        if (isPlainObject(field)) {
          const label = cleanText(firstPresentValue(field, ['label', 'name', 'title', 'key'])) || `Поле ${index + 1}`
          const value = cleanText(firstPresentValue(field, ['value', 'text', 'content', 'description']))
          return { label, value }
        }

        const value = cleanText(field)
        return value ? { label: `Поле ${index + 1}`, value } : null
      })
      .filter((field) => field && (field.label || field.value))
  }

  if (isPlainObject(fields)) {
    return Object.entries(fields)
      .map(([label, value], index) => ({
        label: cleanText(label) || `Поле ${index + 1}`,
        value: cleanText(value)
      }))
      .filter((field) => field.label || field.value)
  }

  const value = cleanText(fields)
  return value ? [{ label: 'Поле 1', value }] : []
}

function detectRiskLevel(value) {
  const text = cleanText(value).toLowerCase()
  if (/критично|danger|срочно|urgent/.test(text)) return 'danger'
  if (/высокий|высокая|high/.test(text)) return 'high'
  if (/средний|средняя|medium/.test(text)) return 'medium'
  if (/низкий|низкая|low/.test(text)) return 'low'
  return 'neutral'
}

export function normalizeDocumentRisks(risks) {
  if (!risks) return []

  const source = Array.isArray(risks) ? risks : [risks]
  return source
    .map((risk) => {
      if (isPlainObject(risk)) {
        const text = cleanText(firstPresentValue(risk, ['text', 'message', 'description', 'value', 'label']))
        if (!text) return null
        const level = cleanText(firstPresentValue(risk, ['level', 'severity', 'risk'])) || detectRiskLevel(text)
        return { level: detectRiskLevel(level === 'neutral' ? text : level), text }
      }

      const text = cleanText(risk)
      return text ? { level: detectRiskLevel(text), text } : null
    })
    .filter(Boolean)
}

export function normalizeDocumentActions(actions) {
  if (!actions) return []

  const source = Array.isArray(actions) ? actions : [actions]
  return source
    .map((action, index) => {
      if (isPlainObject(action)) {
        const label = cleanText(firstPresentValue(action, ['label', 'title', 'text', 'name'])) || `Действие ${index + 1}`
        const value = cleanText(firstPresentValue(action, ['action', 'type', 'value'])) || 'custom'
        return { label, action: value }
      }

      const label = cleanText(action)
      return label ? { label, action: 'custom' } : null
    })
    .filter(Boolean)
}

export function normalizeDocumentPreviewPart(part) {
  const source = isPlainObject(part) ? part : {}
  const documentSource = isPlainObject(source.document) ? source.document : source
  const content = valueToText(firstPresentValue(documentSource, ['content', 'text', 'body', 'markdown']) ?? '')
  const summary = cleanText(firstPresentValue(documentSource, ['summary', 'description', 'excerpt']))
  const title = inferDocumentTitle(content || summary, documentSource)
  const kind = inferDocumentKind(content || title, cleanText(documentSource.language), documentSource)
  const language = inferDocumentLanguage(content || summary || title, documentSource)

  return {
    type: PART_TYPES.DOCUMENT_PREVIEW,
    id: cleanText(source.id || documentSource.id),
    document: {
      title,
      kind,
      language,
      status: cleanText(firstPresentValue(documentSource, ['status', 'state'])) || 'draft',
      summary,
      content,
      fields: normalizeDocumentFields(documentSource.fields),
      risks: normalizeDocumentRisks(documentSource.risks),
      actions: normalizeDocumentActions(documentSource.actions),
      fileName: cleanText(firstPresentValue(documentSource, ['fileName', 'filename'])),
      mimeType: cleanText(documentSource.mimeType),
      size: cleanText(documentSource.size),
      fileId: cleanText(documentSource.fileId),
      documentId: cleanText(documentSource.documentId)
    }
  }
}

export function documentFenceToPart(fence, options = {}) {
  const source = isPlainObject(fence) ? fence : {}
  return normalizeDocumentPreviewPart({
    id: source.id,
    type: PART_TYPES.DOCUMENT_PREVIEW,
    document: {
      title: inferDocumentTitle(source.content, options.metadata),
      kind: inferDocumentKind(source.content, source.language, options.metadata),
      language: inferDocumentLanguage(source.content, options.metadata),
      status: 'draft',
      content: source.content
    }
  })
}

export function splitMarkdownByDocumentFences(markdown, options = {}) {
  const text = String(markdown ?? '')
  const fences = parseDocumentFences(text, options)
  if (!fences.length) {
    return text.trim() ? [{ type: PART_TYPES.MARKDOWN, text }] : []
  }

  const parts = []
  let cursor = 0

  fences.forEach((fence) => {
    const before = text.slice(cursor, fence.start)
    if (before.trim()) {
      parts.push({ type: PART_TYPES.MARKDOWN, text: before.trim() })
    }

    parts.push(documentFenceToPart(fence, options))
    cursor = fence.end
  })

  const after = text.slice(cursor)
  if (after.trim()) {
    parts.push({ type: PART_TYPES.MARKDOWN, text: after.trim() })
  }

  return parts
}

export function documentToPlainText(document) {
  const source = isPlainObject(document) ? document : {}
  const content = valueToText(source.content).trim()
  if (content) return content

  const summary = valueToText(source.summary).trim()
  if (summary) return summary

  return valueToText(source.title).trim()
}

export function shouldCollapseDocumentContent(content) {
  return valueToText(content).length > CONTENT_COLLAPSE_LIMIT
}
