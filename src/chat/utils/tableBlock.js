const TABLE_LANGUAGES = new Set(['table', 'datatable', 'grid'])

function trimCells(value) {
  return String(value || '')
    .split('|')
    .map((cell) => cell.trim())
}

function cleanString(value) {
  return String(value ?? '').trim()
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

  const columns = Array.isArray(block.columns)
    ? block.columns.map(cleanString).filter(Boolean)
    : []
  if (!columns.length) return null

  const rows = Array.isArray(block.rows)
    ? block.rows
        .filter(Array.isArray)
        .map((row) => normalizeRow(row, columns.length))
    : []

  return {
    id: cleanString(block.id),
    type: 'table',
    title: cleanString(block.title),
    columns,
    rows,
    caption: cleanString(block.caption),
    source_ids: Array.isArray(block.source_ids) ? block.source_ids.map(cleanString).filter(Boolean) : []
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

export function stripTableArtifacts(text) {
  return String(text || '')
    .replace(/```(?:table|datatable|grid)?\s*[\s\S]*?```/gi, ' ')
    .split('\n')
    .filter((line) => !/^\s*(?:table\s+)?(?:columns|row)\s*:/i.test(line))
    .join('\n')
    .replace(/\b(?:table\s+)?columns\s*:[\s\S]*$/i, ' ')
    .replace(/\n{2,}/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{2,}/g, '\n')
    .trim()
}
