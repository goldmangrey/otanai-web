import { useMemo, useState } from 'react'

import { copyText } from '../../utils/clipboard.js'
import {
  detectCellBadge,
  normalizeSmartTablePart,
  shouldClampCell,
  tableToCsv,
  tableToMarkdown
} from './tableUtils.js'

function SmartCell({ value, columnName, cellKey }) {
  const text = String(value ?? '')
  const badge = detectCellBadge(text, columnName)
  const [expanded, setExpanded] = useState(false)
  const shouldClamp = shouldClampCell(text)
  const visibleText = shouldClamp && !expanded ? `${text.slice(0, 220).trimEnd()}...` : text

  if (badge) {
    return (
      <span className={`otan-smart-table__badge otan-smart-table__badge--${badge.variant}`}>
        {badge.label}
      </span>
    )
  }

  return (
    <span className="otan-smart-table__cell-text">
      {visibleText}
      {shouldClamp ? (
        <button
          className="otan-smart-table__expand"
          type="button"
          aria-expanded={expanded}
          aria-controls={cellKey}
          onClick={() => setExpanded((current) => !current)}
        >
          {expanded ? 'Свернуть' : 'Показать полностью'}
        </button>
      ) : null}
    </span>
  )
}

function EmptyState() {
  return <p className="otan-smart-table__empty">Таблица без данных</p>
}

function CopyActions({ table }) {
  const [copiedFormat, setCopiedFormat] = useState('')

  async function handleCopy(format) {
    const value = format === 'csv' ? tableToCsv(table) : tableToMarkdown(table)
    const copied = await copyText(value)

    if (!copied) return

    setCopiedFormat(format)
    window.setTimeout(() => {
      setCopiedFormat((current) => (current === format ? '' : current))
    }, 1400)
  }

  return (
    <div className="otan-smart-table__actions" aria-label="Table export actions">
      <button className="otan-smart-table__button" type="button" onClick={() => handleCopy('markdown')}>
        {copiedFormat === 'markdown' ? 'Скопировано' : 'Markdown'}
      </button>
      <button className="otan-smart-table__button" type="button" onClick={() => handleCopy('csv')}>
        {copiedFormat === 'csv' ? 'Скопировано' : 'CSV'}
      </button>
    </div>
  )
}

function DesktopTable({ table }) {
  return (
    <div className="otan-smart-table__desktop">
      <div className="otan-smart-table__scroll">
        <table className="otan-smart-table__table">
          <thead>
            <tr>
              {table.columns.map((column, index) => (
                <th className="otan-smart-table__th" key={`${column.key}-${index}`} scope="col">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => (
              <tr key={`smart-table-row-${rowIndex}`}>
                {table.columns.map((column, cellIndex) => {
                  const cellKey = `smart-table-cell-${rowIndex}-${cellIndex}`
                  return (
                    <td className="otan-smart-table__td" id={cellKey} key={cellKey}>
                      <SmartCell value={row[cellIndex]} columnName={column.label} cellKey={cellKey} />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MobileCards({ table }) {
  return (
    <div className="otan-smart-table__mobile">
      {table.rows.map((row, rowIndex) => {
        const firstValue = row[0]
        const title = firstValue ? firstValue : `Строка ${rowIndex + 1}`

        return (
          <article className="otan-smart-table__card" key={`smart-table-card-${rowIndex}`}>
            <h4 className="otan-smart-table__card-title">{title}</h4>
            <dl className="otan-smart-table__fields">
              {table.columns.map((column, cellIndex) => {
                const cellKey = `smart-table-mobile-cell-${rowIndex}-${cellIndex}`
                return (
                  <div className="otan-smart-table__field" key={cellKey}>
                    <dt className="otan-smart-table__field-label">{column.label}</dt>
                    <dd className="otan-smart-table__field-value" id={cellKey}>
                      <SmartCell value={row[cellIndex]} columnName={column.label} cellKey={cellKey} />
                    </dd>
                  </div>
                )
              })}
            </dl>
          </article>
        )
      })}
    </div>
  )
}

function SourceIds({ sourceIds }) {
  if (!sourceIds.length) return null

  return (
    <div className="otan-smart-table__sources" aria-label="Table sources">
      <span>Источники таблицы</span>
      {sourceIds.map((sourceId) => (
        <code key={sourceId}>{sourceId}</code>
      ))}
    </div>
  )
}

function OtanSmartTable({
  part = null,
  title = '',
  caption = '',
  columns = [],
  rows = [],
  sourceIds = [],
  isStreaming = false
}) {
  const table = useMemo(
    () =>
      normalizeSmartTablePart(
        part || {
          title,
          caption,
          columns,
          rows,
          sourceIds
        }
      ),
    [caption, columns, part, rows, sourceIds, title]
  )

  const hasColumns = table.columns.length > 0
  const hasRows = table.rows.length > 0
  const hasTableData = hasColumns && hasRows

  return (
    <section
      className="otan-smart-table"
      aria-busy={isStreaming || undefined}
      aria-label={table.title || 'Smart table'}
    >
      <header className="otan-smart-table__header">
        <div className="otan-smart-table__heading">
          {table.title ? <h3 className="otan-smart-table__title">{table.title}</h3> : null}
          {table.caption ? <p className="otan-smart-table__caption otan-smart-table__caption--top">{table.caption}</p> : null}
        </div>
        {hasColumns ? <CopyActions table={table} /> : null}
      </header>

      {hasTableData ? (
        <>
          <DesktopTable table={table} />
          <MobileCards table={table} />
        </>
      ) : (
        <EmptyState />
      )}

      <SourceIds sourceIds={table.sourceIds} />
    </section>
  )
}

export default OtanSmartTable
