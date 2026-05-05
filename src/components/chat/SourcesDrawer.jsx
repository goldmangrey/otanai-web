import { useEffect } from 'react'

import { getSourceSelectionSummary } from '../../chat/utils/sources.js'
import SourcePanel from '../../chat/rich-response/parts/sources/SourcePanel.jsx'
import { normalizeSources } from '../../chat/rich-response/parts/sources/sourceUtils.js'

function SourceSummary({ summary }) {
  if (!summary) return null
  const items = [
    ['Найдено', summary.retrieved],
    ['Проверено', summary.reviewed],
    ['Использовано', summary.used],
    ['Показано', summary.cited],
    ['Официальных', summary.official]
  ].filter(([, value]) => value)

  if (!items.length) return null

  return (
    <dl className="sources-drawer__summary" aria-label="Source selection summary">
      {items.map(([label, value]) => (
        <div key={label} className="sources-drawer__summary-item">
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function SourcesDrawer({ sources, metadata = null, isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return undefined
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const summary = getSourceSelectionSummary(metadata)
  const normalizedSources = normalizeSources(sources)

  return (
    <div className="sources-drawer-backdrop" role="presentation" onMouseDown={onClose}>
      <aside
        className="sources-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sources-drawer-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="sources-drawer__header">
          <div>
            <h2 id="sources-drawer-title">Источники ответа</h2>
            <p>{summary?.cited || normalizedSources.length} источников показано</p>
          </div>
          <button type="button" className="sources-drawer__close" aria-label="Закрыть источники" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="sources-drawer__body">
          <SourceSummary summary={summary} />
          <SourcePanel compact sources={normalizedSources} title="Источники ответа" />
        </div>
      </aside>
    </div>
  )
}

export default SourcesDrawer
