const TABLE_LANGUAGES = new Set(['table', 'datatable', 'grid'])
const MALFORMED_RISK_PIPE_TABLE =
  /(#{0,6}\s*Таблица\s+рисков)\s+(?:Колонка\s*1|Риск)\s*\|\s*(?:Колонка\s*2|Что\s+это\s+значит)\s*\|\s*(?:Колонка\s*3|Источник)\s*(?:(?:-{3,}\s*\|\s*-{3,}\s*\|\s*-{3,})|(?:Риск\s*\|\s*Что\s+это\s+значит\s*\|\s*Источник))?\s*(?<body>.+)$/i
const SOURCE_MARKER = /\[source:\s*([^\]]+)\]/gi
const POST_TABLE_SECTION_MARKERS = [
  'Короткий вывод',
  'Коротко',
  'Вывод',
  'Итог',
  'Что делать',
  'Что делать дальше',
  'Пошагово',
  'Важно',
  'Риски',
  'Ограничения',
  'Источники',
  'После таблицы',
  '3 самых важных шага',
  'Если срочно',
  'Чтобы подсказать точнее'
]

function trimCells(value) {
  return String(value || '')
    .split('|')
    .map((cell) => cell.trim())
}

function cleanString(value) {
  return String(value ?? '').trim()
}

function compactString(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

function dedupe(values) {
  const seen = new Set()
  const result = []
  for (const value of values) {
    const item = compactString(value)
    if (!item || seen.has(item)) continue
    seen.add(item)
    result.push(item)
  }
  return result
}

function sourceIdsFromText(value) {
  return dedupe([...String(value ?? '').matchAll(SOURCE_MARKER)].map((match) => match[1]))
}

function stripSourceMarkers(value) {
  return compactString(String(value ?? '').replace(SOURCE_MARKER, ''))
}

function normalizeRow(cells, columnCount) {
  const normalizedCells = Array.isArray(cells) ? cells.map(cleanString) : []
  if (normalizedCells.length < columnCount) {
    return [...normalizedCells, ...Array.from({ length: columnCount - normalizedCells.length }, () => '')]
  }
  if (normalizedCells.length > columnCount) {
    return [
      ...normalizedCells.slice(0, columnCount - 1),
      normalizedCells.slice(columnCount - 1).join(' | ')
    ]
  }
  return normalizedCells
}

function normalizeTableData(columns, rows, sourceIds = []) {
  const cleanColumns = Array.isArray(columns) ? columns.map(cleanString).filter(Boolean) : []
  const cleanRows = Array.isArray(rows)
    ? rows
        .filter(Array.isArray)
        .map((row) => normalizeRow(row, cleanColumns.length))
    : []
  const collectedSourceIds = [...sourceIds]
  cleanRows.forEach((row) => {
    row.forEach((cell) => {
      collectedSourceIds.push(...sourceIdsFromText(cell))
    })
  })
  const strippedRows = cleanRows.map((row) => row.map(stripSourceMarkers))
  const sourceColumnIndexes = cleanColumns
    .map((column, index) => ({ column: column.toLowerCase(), index }))
    .filter(({ column }) => ['источник', 'источники', 'source', 'sources'].includes(column))
    .map(({ index }) => index)

  for (const index of [...sourceColumnIndexes].reverse()) {
    const columnHasContent = strippedRows.some((row) => compactString(row[index]))
    if (columnHasContent) {
      cleanColumns[index] = 'Комментарий'
      continue
    }
    cleanColumns.splice(index, 1)
    strippedRows.forEach((row) => row.splice(index, 1))
  }

  return {
    columns: cleanColumns,
    rows: strippedRows.filter((row) => row.some((cell) => compactString(cell))),
    source_ids: dedupe(collectedSourceIds)
  }
}

function looksLikeNextRiskRow(value) {
  const compact = compactString(value)
  if (!compact || compact.length > 90) return false
  if (compact.toLowerCase().includes('[source:') || compact.includes('|')) return false
  return /^[A-ZА-ЯЁ0-9]/.test(compact)
}

function splitSourceTailCell(value) {
  const compact = compactString(value)
  const matches = [...compact.matchAll(/\[source:\s*[^\]]+\]/gi)]
  if (!matches.length) return [compact]

  const lastMatch = matches[matches.length - 1]
  const sourceEnd = lastMatch.index + lastMatch[0].length
  const tail = compact.slice(sourceEnd).trim()
  if (!looksLikeNextRiskRow(tail)) return [compact]

  const current = compact.slice(0, sourceEnd).trim()
  return current ? [current, tail] : [tail]
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function tableBodyBeforeFollowupSections(value) {
  const markers = POST_TABLE_SECTION_MARKERS.map(escapeRegExp).join('|')
  const boundary = new RegExp(
    `\\s+(?=(?:#{1,6}\\s+)?(?:${markers})\\s*:|(?:#{1,6}\\s+)(?:${markers})(?:\\s|$)|>\\s+|\\d+\\.\\s+\\S|[-*]\\s+\\S)`,
    'i'
  )
  return String(value || '').split(boundary, 1)[0].trim()
}

function parseMalformedRiskPipeTable(text) {
  const compact = compactString(text)
  const match = compact.match(MALFORMED_RISK_PIPE_TABLE)
  if (!match?.groups?.body) return null

  const body = tableBodyBeforeFollowupSections(match.groups.body)
  const cells = []
  for (const rawCell of body.split('|')) {
    const cell = compactString(rawCell)
    if (!cell || /^:?-{3,}:?$/.test(cell)) continue
    cells.push(...splitSourceTailCell(cell))
  }

  if (cells.length < 6) return null
  const usableCellCount = cells.length - (cells.length % 3)
  const rows = []
  for (let index = 0; index < usableCellCount; index += 3) {
    rows.push(cells.slice(index, index + 3))
  }
  if (rows.length < 2) return null
  const raw = `${match[0].slice(0, match[0].length - match.groups.body.length)}${body}`.trim()

  return {
    raw,
    block: {
      type: 'table',
      title: cleanString(match[1]).replace(/^#{1,6}\s*/, ''),
      columns: ['Риск', 'Что это значит', 'Источник'],
      rows
    }
  }
}

export function isTableBlockLanguage(language = '') {
  return TABLE_LANGUAGES.has(String(language || '').trim().toLowerCase())
}

export function parseTableBlock(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const columnsLine = lines.find((line) => /^columns\s*:/i.test(line))
  if (!columnsLine) {
    return {
      columns: [],
      rows: [],
      error: 'missing_columns'
    }
  }

  const columns = trimCells(columnsLine.replace(/^columns\s*:/i, '')).filter(Boolean)
  if (!columns.length) {
    return {
      columns: [],
      rows: [],
      error: 'empty_columns'
    }
  }

  const rows = lines
    .filter((line) => /^row\s*:/i.test(line))
    .map((line) => trimCells(line.replace(/^row\s*:/i, '')))
    .map((cells) => normalizeRow(cells, columns.length))

  return {
    columns,
    rows,
    error: null
  }
}

export function normalizeTableBlock(block) {
  if (!block || typeof block !== 'object' || block.type !== 'table') {
    return null
  }

  const { columns, rows, source_ids: sourceIds } = normalizeTableData(
    block.columns,
    block.rows,
    Array.isArray(block.source_ids) ? block.source_ids : []
  )
  if (!columns.length) return null

  return {
    id: cleanString(block.id),
    type: 'table',
    title: cleanString(block.title),
    columns,
    rows,
    caption: cleanString(block.caption),
    source_ids: sourceIds
  }
}

export function normalizeCalloutBlock(block) {
  if (!block || typeof block !== 'object' || block.type !== 'callout') {
    return null
  }

  const content = cleanString(block.content)
  if (!content) return null

  const variant = cleanString(block.variant).toLowerCase()
  const allowedVariant = ['info', 'warning', 'success', 'danger'].includes(variant) ? variant : 'info'

  return {
    id: cleanString(block.id),
    type: 'callout',
    variant: allowedVariant,
    title: cleanString(block.title),
    content
  }
}

export function normalizeStructuredBlocks(metadata) {
  const blocks = metadata?.blocks
  if (!Array.isArray(blocks)) return []
  return blocks
    .map((block) => {
      if (block?.type === 'table') return normalizeTableBlock(block)
      if (block?.type === 'callout') return normalizeCalloutBlock(block)
      return null
    })
    .filter(Boolean)
}

export function recoverMalformedTableBlocks(text) {
  const recovered = parseMalformedRiskPipeTable(text)
  return recovered ? [normalizeTableBlock(recovered.block)].filter(Boolean) : []
}

export function stripRecoveredTableArtifacts(text) {
  const recovered = parseMalformedRiskPipeTable(text)
  if (!recovered) return String(text || '')
  const value = String(text || '')
  const stripped = value.replace(recovered.raw, ' ').trim()
  if (stripped !== value) return stripped
  return compactString(value).replace(recovered.raw, ' ').trim()
}

export function stripTableArtifacts(text) {
  return String(text || '')
    .replace(/```(?:table|datatable|grid)?\s*[\s\S]*?```/gi, ' ')
    .replace(/(?:^\s*\|.+\|\s*$\n?){2,}/gim, ' ')
    .split('\n')
    .filter((line) => !/^\s*(?:table\s+)?(?:columns|row)\s*:/i.test(line))
    .join('\n')
    .replace(/\b(?:table\s+)?columns\s*:[\s\S]*$/i, ' ')
    .replace(/\n{2,}/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n[ \t]+/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim()
}
