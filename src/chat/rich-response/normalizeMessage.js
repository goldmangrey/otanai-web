import { PART_TYPES, normalizePartType } from './partTypes.js'
import { stripTableArtifacts } from '../utils/tableBlock.js'
import {
  normalizeDocumentPreviewPart,
  splitMarkdownByDocumentFences
} from './parts/documentPreviewUtils.js'
import {
  isLegalPartType,
  metadataBlockToLegalPart,
  normalizeLegalPart
} from './parts/legal/legalBlockUtils.js'
import {
  isSourcePanelPart,
  metadataToSourcePanelPart,
  normalizeSourcePanelPart
} from './parts/sources/sourceUtils.js'
import {
  shouldExtractDocumentFences,
  shouldUseDraftNormalization
} from './streaming/streamingRenderUtils.js'

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function cleanString(value) {
  return String(value ?? '').trim()
}

function firstPresentValue(source, keys) {
  const object = asObject(source)
  for (const key of keys) {
    if (object[key] !== undefined && object[key] !== null) return object[key]
  }
  return undefined
}

function cellToText(value) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (Array.isArray(value)) return value.map(cellToText).filter(Boolean).join(', ')

  const object = asObject(value)
  const displayValue = firstPresentValue(object, ['value', 'label', 'text', 'title'])
  if (displayValue !== undefined) return cellToText(displayValue)

  try {
    return JSON.stringify(object)
  } catch {
    return ''
  }
}

function normalizeColumnDescriptors(columns, rows) {
  if (Array.isArray(columns) && columns.length) {
    return columns
      .map((column, index) => {
        const object = asObject(column)
        if (Object.keys(object).length) {
          const rawKey = firstPresentValue(object, ['key', 'id', 'accessor', 'field', 'name'])
          const rawLabel = firstPresentValue(object, ['label', 'title', 'text', 'name', 'value'])
          const label = cleanString(rawLabel ?? rawKey) || `Колонка ${index + 1}`
          const key = cleanString(rawKey ?? rawLabel) || label
          return { key, label }
        }

        const label = cellToText(column) || `Колонка ${index + 1}`
        return { key: label, label }
      })
      .filter((column) => column.label)
  }

  if (Array.isArray(rows)) {
    const objectKeys = []
    const seen = new Set()
    rows.forEach((row) => {
      const object = asObject(row)
      Object.keys(object).forEach((key) => {
        if (seen.has(key)) return
        seen.add(key)
        objectKeys.push(key)
      })
    })

    if (objectKeys.length) {
      return objectKeys.map((key) => ({ key, label: key }))
    }

    const columnCount = rows.reduce((max, row) => (Array.isArray(row) ? Math.max(max, row.length) : max), 0)
    if (columnCount > 0) {
      return Array.from({ length: columnCount }, (_, index) => ({
        key: `column_${index + 1}`,
        label: `Колонка ${index + 1}`
      }))
    }
  }

  return []
}

function normalizeRows(rows, columns) {
  if (!Array.isArray(rows)) return []

  return rows
    .map((row) => {
      if (Array.isArray(row)) {
        const normalized = columns.map((_, index) => cellToText(row[index]))

        if (row.length > columns.length && columns.length) {
          normalized[columns.length - 1] = row
            .slice(columns.length - 1)
            .map(cellToText)
            .filter(Boolean)
            .join(' | ')
        }

        return normalized
      }

      const object = asObject(row)
      if (Object.keys(object).length) {
        return columns.map((column) => cellToText(object[column.key] ?? object[column.label]))
      }

      return null
    })
    .filter((row) => Array.isArray(row) && row.some(Boolean))
}

function normalizeSourceIds(value) {
  if (!Array.isArray(value)) return []
  return value.map(cleanString).filter(Boolean)
}

function normalizeTablePart(block) {
  const source = asObject(block)
  const columnDescriptors = normalizeColumnDescriptors(source.columns, source.rows)
  const columns = columnDescriptors.map((column) => column.label).filter(Boolean)
  const rows = normalizeRows(source.rows, columnDescriptors)

  if (!columns.length) return null

  return {
    type: PART_TYPES.TABLE,
    title: cleanString(source.title),
    columns,
    rows,
    caption: cleanString(source.caption),
    source_ids: normalizeSourceIds(source.source_ids || source.sourceIds)
  }
}

export function normalizePart(part) {
  const source = asObject(part)
  const type = normalizePartType(source.type)

  if (type === PART_TYPES.MARKDOWN) {
    const text = String(source.text ?? source.content ?? '')
    return text ? { ...source, type, text } : null
  }

  if (type === PART_TYPES.TABLE) {
    return normalizeTablePart(source)
  }

  if (type === PART_TYPES.DOCUMENT_PREVIEW) {
    return normalizeDocumentPreviewPart({ ...source, type })
  }

  if (type === PART_TYPES.SOURCE_PANEL) {
    const sourcePanel = normalizeSourcePanelPart({ ...source, type })
    return sourcePanel.sources.length ? sourcePanel : null
  }

  if (isLegalPartType(source.type)) {
    return normalizeLegalPart(source)
  }

  return {
    type: PART_TYPES.UNKNOWN,
    raw: part
  }
}

export function oldMessageToParts(message, options = {}) {
  const source = asObject(message)
  const metadata = asObject(source.metadata)
  const parts = []
  const content = String(source.content ?? '')
  const blocks = Array.isArray(metadata.blocks) ? metadata.blocks : []
  const metadataParts = Array.isArray(metadata.parts) ? metadata.parts : []
  const normalizedMetadataParts = metadataParts
    .map((part) => {
      if (isSourcePanelPart(asObject(part).type)) return null
      return normalizePart(part)
    })
    .filter(Boolean)
  const metadataPartTypes = new Set(normalizedMetadataParts.map((part) => part.type))
  const hasTableBlocks = blocks.some((block) => asObject(block).type === PART_TYPES.TABLE)
  const draftMode = shouldUseDraftNormalization(source, options)
  const extractDocumentFences = shouldExtractDocumentFences(source, options)

  if (content.trim()) {
    const contentParts = extractDocumentFences
      ? splitMarkdownByDocumentFences(content, { metadata }).map((part) => {
          if (!hasTableBlocks || draftMode || part.type !== PART_TYPES.MARKDOWN) return part
          return {
            ...part,
            text: stripTableArtifacts(part.text)
          }
        }).filter((part) => part.type !== PART_TYPES.MARKDOWN || part.text.trim())
      : [{ type: PART_TYPES.MARKDOWN, text: content }]

    parts.push(...contentParts)
  }

  parts.push(...normalizedMetadataParts)

  if (!draftMode) {
    blocks.forEach((block) => {
      const blockObject = asObject(block)
      if (blockObject.type === PART_TYPES.TABLE) {
        if (metadataPartTypes.has(PART_TYPES.TABLE)) return
        const tablePart = normalizeTablePart(blockObject)
        if (tablePart) parts.push(tablePart)
        return
      }

      const blockType = normalizePartType(blockObject.type)
      if (blockType === PART_TYPES.DOCUMENT_PREVIEW || blockObject.type === 'document') {
        if (metadataPartTypes.has(PART_TYPES.DOCUMENT_PREVIEW)) return
        parts.push(normalizeDocumentPreviewPart({ ...blockObject, type: PART_TYPES.DOCUMENT_PREVIEW }))
        return
      }

      if (isSourcePanelPart(blockObject.type)) return

      const legalPart = metadataBlockToLegalPart(blockObject)
      if (legalPart) {
        if (metadataPartTypes.has(legalPart.type)) return
        parts.push(legalPart)
      }
    })
  }

  const sourcePanelPart = metadataToSourcePanelPart(metadata)
  if (sourcePanelPart) parts.push(sourcePanelPart)

  return parts
}

export function normalizeMessage(message, options = {}) {
  const source = asObject(message)
  const existingParts = Array.isArray(source.parts) ? source.parts : []
  const parts = existingParts.length
    ? existingParts.map(normalizePart).filter(Boolean)
    : oldMessageToParts(source, options)

  return {
    ...source,
    parts
  }
}
