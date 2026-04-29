const HEADING_MARKER = /#{1,6}\s+/
const NUMBERED_ITEM = /\d{1,2}[.)]\s+/
const BULLET_ITEM = /-\s+\S/
const FENCE_SPLIT = /(```[\s\S]*?```)/
const TABLE_SEPARATOR = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/

function normalizeNumberedHeadings(text) {
  return text.replace(/^#{1,2}\s+(\d{1,2})\)\s+/gm, '### $1. ')
}

function normalizeHeadingBoundaries(text) {
  return text
    .replace(new RegExp(`([^\\n])\\s+(${HEADING_MARKER.source})`, 'g'), '$1\n\n$2')
    .replace(new RegExp(`^(${HEADING_MARKER.source}.+?)\\s+(${NUMBERED_ITEM.source})`, 'gm'), '$1\n\n$2')
}

function normalizeBulletLists(text) {
  return text
    .split(/\n{2,}/)
    .map((block) => {
      const matches = [...block.matchAll(new RegExp(`(^|\\s)(${BULLET_ITEM.source})`, 'g'))]
      if (matches.length < 3) return block

      return block.replace(/\s+-\s+(?=\S)/g, '\n- ')
    })
    .join('\n\n')
}

function normalizeNumberedLists(text) {
  return text
    .split(/\n{2,}/)
    .map((block) => {
      const matches = [...block.matchAll(new RegExp(`(^|\\s)(${NUMBERED_ITEM.source})`, 'g'))]
      if (matches.length < 2) return block

      return block.replace(new RegExp(`\\s+(${NUMBERED_ITEM.source})`, 'g'), '\n$1')
    })
    .join('\n\n')
}

function isFenceLine(line) {
  return line.trim().startsWith('```')
}

function splitTableCells(line) {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '')
  return trimmed.split('|').map((cell) => cell.trim())
}

function isPseudoTableRow(line) {
  if (!line.includes('|')) return false
  if (/^https?:\/\//i.test(line.trim())) return false

  const cells = splitTableCells(line)
  return cells.length >= 2 && cells.every((cell) => cell.length > 0)
}

function isTableSeparator(line) {
  return TABLE_SEPARATOR.test(line)
}

function isMarkdownTableLine(line) {
  const trimmed = line.trim()
  return trimmed.startsWith('|') && trimmed.endsWith('|') && splitTableCells(trimmed).length >= 2
}

function isSeparatorCell(cell) {
  return /^:?-{3,}:?$/.test(cell.trim())
}

function isSeparatorRow(cells) {
  return cells.length >= 2 && cells.every(isSeparatorCell)
}

function normalizeTableRow(line) {
  return `| ${splitTableCells(line).join(' | ')} |`
}

function buildSeparatorFor(row) {
  const cells = splitTableCells(row)
  return `| ${cells.map(() => '---').join(' | ')} |`
}

function formatTableRow(cells) {
  return `| ${cells.map((cell) => cell.trim()).join(' | ')} |`
}

function normalizeOneLineTableLine(line) {
  if (!line.includes('|')) return line
  if (!/\|\s*:?-{3,}:?\s*\|/.test(line)) return line

  const tokens = line.split('|').map((token) => token.trim())
  const hasLeadingPipe = tokens[0] === ''
  const firstToken = hasLeadingPipe ? '' : tokens[0]
  const hasHeadingPrefix = /^#{1,6}\s+\S/.test(firstToken)
  const startIndex = hasLeadingPipe || hasHeadingPrefix ? 1 : 0
  const heading = hasHeadingPrefix ? firstToken : ''
  const rows = []
  let currentRow = []

  for (let index = startIndex; index < tokens.length; index += 1) {
    const token = tokens[index]
    if (!token) {
      if (currentRow.length) {
        rows.push(currentRow)
        currentRow = []
      }
      continue
    }
    currentRow.push(token)
  }

  if (currentRow.length) rows.push(currentRow)
  if (rows.length < 3) return line

  const [headerRow, separatorRow, ...dataRows] = rows
  if (isSeparatorRow(headerRow) || !isSeparatorRow(separatorRow)) return line
  if (headerRow.length !== separatorRow.length || headerRow.length < 2) return line
  if (!dataRows.length || dataRows.some((row) => row.length !== headerRow.length || isSeparatorRow(row))) return line

  const table = [
    formatTableRow(headerRow),
    formatTableRow(separatorRow),
    ...dataRows.map(formatTableRow)
  ].join('\n')

  return heading ? `${heading}\n\n${table}` : table
}

function normalizeOneLineTables(text) {
  return text
    .split('\n')
    .map(normalizeOneLineTableLine)
    .join('\n')
}

function normalizePseudoTablesInText(text) {
  const lines = normalizeOneLineTables(text).split('\n')
  const normalized = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index]
    if (!isPseudoTableRow(line)) {
      normalized.push(line)
      index += 1
      continue
    }

    const tableLines = []
    while (index < lines.length && (isPseudoTableRow(lines[index]) || isTableSeparator(lines[index]))) {
      tableLines.push(lines[index])
      index += 1
    }

    const dataRows = tableLines.filter((item) => isPseudoTableRow(item))
    if (dataRows.length < 2) {
      normalized.push(...tableLines)
      continue
    }

    const hasSeparator = tableLines.length > 1 && isTableSeparator(tableLines[1])
    normalized.push(normalizeTableRow(tableLines[0]))
    normalized.push(hasSeparator ? tableLines[1] : buildSeparatorFor(tableLines[0]))

    const remainingRows = hasSeparator ? tableLines.slice(2) : tableLines.slice(1)
    normalized.push(...remainingRows.map((item) => (isPseudoTableRow(item) ? normalizeTableRow(item) : item)))
  }

  return normalized.join('\n')
}

function normalizePseudoTables(text) {
  return text
    .split(FENCE_SPLIT)
    .map((part) => (part.startsWith('```') ? part : normalizePseudoTablesInText(part)))
    .join('')
}

function normalizeOutsideProtectedBlocks(text, normalizer) {
  const lines = text.split('\n')
  const segments = []
  let buffer = []
  let protectedBuffer = []
  let isInFence = false

  const flushBuffer = () => {
    if (!buffer.length) return
    segments.push(normalizer(buffer.join('\n')))
    buffer = []
  }

  const flushProtected = () => {
    if (!protectedBuffer.length) return
    segments.push(protectedBuffer.join('\n'))
    protectedBuffer = []
  }

  for (const line of lines) {
    const fenceLine = isFenceLine(line)
    const protectedLine = isInFence || fenceLine || isMarkdownTableLine(line)

    if (protectedLine) {
      flushBuffer()
      protectedBuffer.push(line)
      if (fenceLine) isInFence = !isInFence
      continue
    }

    flushProtected()
    buffer.push(line)
  }

  flushBuffer()
  flushProtected()

  return segments.join('\n')
}

function normalizeMarkdownSpacing(text) {
  return text
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim()
}

export function normalizeAssistantMarkdown(text) {
  if (!text) return ''

  const normalizedTables = normalizePseudoTables(String(text).replace(/\r\n/g, '\n'))
  const normalizedHeadings = normalizeOutsideProtectedBlocks(
    normalizedTables,
    (part) => normalizeNumberedHeadings(normalizeHeadingBoundaries(part))
  )
  const normalizedNumberedLists = normalizeOutsideProtectedBlocks(normalizedHeadings, normalizeNumberedLists)
  const normalizedBulletLists = normalizeOutsideProtectedBlocks(normalizedNumberedLists, normalizeBulletLists)

  return normalizeMarkdownSpacing(
    normalizedBulletLists
  )
}
