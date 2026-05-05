import { PART_TYPES } from '../partTypes.js'

const DEFAULT_CLAMP_LIMIT = 220
const BADGE_MAX_LENGTH = 32

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

function normalizeWhitespace(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

export function cellToText(value) {
  if (value === null || value === undefined) return ''

  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)

  if (Array.isArray(value)) {
    return value.map(cellToText).filter(Boolean).join(', ')
  }

  if (isPlainObject(value)) {
    const displayValue = firstPresentValue(value, ['value', 'label', 'text', 'title'])
    if (displayValue !== undefined) return cellToText(displayValue)

    try {
      return JSON.stringify(value)
    } catch {
      return ''
    }
  }

  return String(value ?? '')
}

function normalizeColumn(column, index) {
  if (isPlainObject(column)) {
    const rawKey = firstPresentValue(column, ['key', 'id', 'accessor', 'field', 'name'])
    const rawLabel = firstPresentValue(column, ['label', 'title', 'text', 'name', 'value'])
    const key = normalizeWhitespace(rawKey ?? rawLabel) || `column_${index + 1}`
    const label = normalizeWhitespace(rawLabel ?? rawKey) || `Колонка ${index + 1}`

    return { key, label }
  }

  const label = normalizeWhitespace(cellToText(column)) || `Колонка ${index + 1}`
  return {
    key: label || `column_${index + 1}`,
    label
  }
}

function rowObjectKeys(rows) {
  const keys = []
  const seen = new Set()

  rows.forEach((row) => {
    if (!isPlainObject(row)) return
    Object.keys(row).forEach((key) => {
      if (seen.has(key)) return
      seen.add(key)
      keys.push(key)
    })
  })

  return keys
}

function maxArrayRowLength(rows) {
  return rows.reduce((max, row) => (Array.isArray(row) ? Math.max(max, row.length) : max), 0)
}

export function normalizeColumns(columns, rows = []) {
  if (Array.isArray(columns) && columns.length) {
    return columns.map(normalizeColumn).filter((column) => column.label)
  }

  if (Array.isArray(rows)) {
    const keys = rowObjectKeys(rows)
    if (keys.length) {
      return keys.map((key, index) => normalizeColumn({ key, label: key }, index))
    }

    const columnCount = maxArrayRowLength(rows)
    if (columnCount > 0) {
      return Array.from({ length: columnCount }, (_, index) => ({
        key: `column_${index + 1}`,
        label: `Колонка ${index + 1}`
      }))
    }
  }

  return []
}

export function normalizeRows(rows, columns = []) {
  if (!Array.isArray(rows)) return []

  return rows.map((row) => {
    if (Array.isArray(row)) {
      const normalized = columns.map((_, index) => cellToText(row[index]))

      if (row.length > columns.length && columns.length) {
        const extra = row.slice(columns.length - 1).map(cellToText).filter(Boolean).join(' | ')
        normalized[columns.length - 1] = extra
      }

      return normalized
    }

    if (isPlainObject(row)) {
      return columns.map((column) => cellToText(row[column.key] ?? row[column.label]))
    }

    if (!columns.length) return [cellToText(row)]
    return columns.map((_, index) => (index === 0 ? cellToText(row) : ''))
  })
}

function normalizeSourceIds(value) {
  if (!Array.isArray(value)) return []
  return value.map((sourceId) => normalizeWhitespace(cellToText(sourceId))).filter(Boolean)
}

export function normalizeSmartTablePart(part) {
  const source = isPlainObject(part) ? part : {}
  const rowsSource = Array.isArray(source.rows) ? source.rows : []
  const columns = normalizeColumns(source.columns, rowsSource)
  const rows = normalizeRows(rowsSource, columns)

  return {
    type: PART_TYPES.TABLE,
    id: normalizeWhitespace(source.id),
    title: normalizeWhitespace(source.title),
    caption: normalizeWhitespace(source.caption),
    columns,
    rows,
    sourceIds: normalizeSourceIds(source.sourceIds || source.source_ids)
  }
}

export function detectCellBadge(value, columnName = '') {
  const label = normalizeWhitespace(cellToText(value))
  if (!label || label.length > BADGE_MAX_LENGTH) return null

  const text = label.toLowerCase()
  const column = normalizeWhitespace(columnName).toLowerCase()
  const looksLikeClassifier = /риск|risk|status|статус|уровень|level|priority|приоритет/.test(column)

  if (['низкий', 'низкая', 'low'].includes(text)) {
    return { label, variant: 'risk-low' }
  }
  if (['средний', 'средняя', 'medium'].includes(text)) {
    return { label, variant: 'risk-medium' }
  }
  if (['высокий', 'высокая', 'high'].includes(text)) {
    return { label, variant: 'risk-high' }
  }

  if (['да', 'есть', 'подходит', 'активно', 'active', 'yes'].includes(text)) {
    return { label, variant: 'positive' }
  }
  if (['нет', 'не подходит', 'inactive', 'no'].includes(text)) {
    return { label, variant: 'negative' }
  }

  if (['обязательно', 'важно', 'critical', 'критично'].includes(text)) {
    return { label, variant: 'important' }
  }
  if (['опционально', 'необязательно', 'optional'].includes(text)) {
    return { label, variant: 'neutral' }
  }

  if (['просрочено', 'expired', 'overdue', 'срочно', 'urgent'].includes(text)) {
    return { label, variant: 'danger' }
  }

  if (!looksLikeClassifier) return null
  return null
}

export function shouldClampCell(value, limit = DEFAULT_CLAMP_LIMIT) {
  return cellToText(value).length > limit
}

function markdownCell(value) {
  return cellToText(value).replace(/\r?\n/g, ' ').replace(/\|/g, '\\|').trim()
}

function columnLabels(columns = []) {
  return columns.map((column, index) => {
    if (isPlainObject(column)) return column.label || column.key || `Колонка ${index + 1}`
    return cellToText(column) || `Колонка ${index + 1}`
  })
}

export function tableToMarkdown({ columns = [], rows = [] } = {}) {
  const labels = columnLabels(columns)
  if (!labels.length) return ''

  const header = `| ${labels.map(markdownCell).join(' | ')} |`
  const separator = `| ${labels.map(() => '---').join(' | ')} |`
  const body = rows.map((row) => `| ${labels.map((_, index) => markdownCell(row[index])).join(' | ')} |`)

  return [header, separator, ...body].join('\n')
}

export function escapeCsvCell(value) {
  const text = cellToText(value)
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

export function tableToCsv({ columns = [], rows = [] } = {}) {
  const labels = columnLabels(columns)
  if (!labels.length) return ''

  const header = labels.map(escapeCsvCell).join(',')
  const body = rows.map((row) => labels.map((_, index) => escapeCsvCell(row[index])).join(','))

  return [header, ...body].join('\n')
}
