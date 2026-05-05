import { useState } from 'react'

import SourceCard from './SourceCard.jsx'
import { normalizeSourcePanelPart, normalizeSources } from './sourceUtils.js'

function SourcePanel({
  part = null,
  sources = null,
  title = '',
  compact = false,
  collapsible = false,
  defaultCollapsed = false
}) {
  const normalizedPart = normalizeSourcePanelPart(
    part || {
      title,
      sources: Array.isArray(sources) ? sources : []
    }
  )
  const normalizedSources = Array.isArray(sources) ? normalizeSources(sources) : normalizedPart.sources
  const [isCollapsed, setIsCollapsed] = useState(Boolean(defaultCollapsed))
  const count = normalizedSources.length
  const resolvedTitle = title || normalizedPart.title || 'Источники'

  return (
    <section className={`otan-source-panel${compact ? ' otan-source-panel--compact' : ''}`} aria-label={resolvedTitle}>
      <header className="otan-source-panel__header">
        <div>
          <h3 className="otan-source-panel__title">{resolvedTitle}</h3>
          <p className="otan-source-panel__count">
            {count ? `${count} ${count === 1 ? 'источник' : 'источника'}` : 'Источники не найдены'}
          </p>
        </div>
        {collapsible && count ? (
          <button
            className="otan-source-panel__toggle"
            type="button"
            aria-expanded={!isCollapsed}
            onClick={() => setIsCollapsed((current) => !current)}
          >
            {isCollapsed ? 'Показать' : 'Скрыть'}
          </button>
        ) : null}
      </header>

      {!count ? <p className="otan-source-panel__empty">Источники не найдены</p> : null}
      {count && !isCollapsed ? (
        <div className="otan-source-panel__list">
          {normalizedSources.map((source, index) => (
            <SourceCard compact={compact} index={index} key={`${source.id}-${index}`} source={source} />
          ))}
        </div>
      ) : null}
    </section>
  )
}

export default SourcePanel
