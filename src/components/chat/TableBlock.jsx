import { normalizeTableBlock, parseTableBlock } from '../../chat/utils/tableBlock.js'

function TableBlockFallback({ content }) {
  return (
    <pre className="table-block__fallback" aria-label="Table block could not be parsed">
      {content}
    </pre>
  )
}

function TableBlock({ block = null, content = '' }) {
  const table = block ? normalizeTableBlock(block) : parseTableBlock(content)
  const rawContent = String(content || '').replace(/\n$/, '')

  if (!table || table.error || !table.columns.length) {
    return <TableBlockFallback content={rawContent} />
  }

  return (
    <section className="structured-table" aria-label={table.title || 'Structured table'}>
      {table.title ? <h3 className="structured-table__title">{table.title}</h3> : null}
      <div className="structured-table__scroll">
        <table className="structured-table__table">
          <thead>
            <tr>
              {table.columns.map((column, index) => (
                <th key={`table-column-${index}`} scope="col">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, rowIndex) => (
              <tr key={`table-row-${rowIndex}`}>
                {row.map((cell, cellIndex) => (
                  <td key={`table-cell-${rowIndex}-${cellIndex}`}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {table.source_ids.length ? (
        <div className="structured-table__sources" aria-label="Table sources">
          <span>Источники таблицы</span>
          {table.source_ids.map((sourceId) => (
            <code key={sourceId}>{sourceId}</code>
          ))}
        </div>
      ) : null}
      {table.caption ? <p className="structured-table__caption">{table.caption}</p> : null}
    </section>
  )
}

export default TableBlock
