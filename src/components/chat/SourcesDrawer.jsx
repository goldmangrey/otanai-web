function SourceBadge({ children, variant = 'default' }) {
  if (!children) return null
  return <span className={`sources-drawer__badge sources-drawer__badge--${variant}`}>{children}</span>
}

function SourceCard({ source, index }) {
  return (
    <article className="sources-drawer__card">
      <div className="sources-drawer__card-header">
        <span className="sources-drawer__index">{index + 1}</span>
        <div>
          <h3>{source.title}</h3>
          {source.domain ? <p>{source.domain}</p> : null}
        </div>
      </div>

      <div className="sources-drawer__badges" aria-label="Source metadata">
        {source.is_official ? <SourceBadge variant="official">official</SourceBadge> : null}
        <SourceBadge variant={source.trust_level}>{source.trust_level}</SourceBadge>
        {source.source_type && source.source_type !== 'unknown' ? (
          <SourceBadge>{source.source_type}</SourceBadge>
        ) : null}
        <SourceBadge>{source.version_date}</SourceBadge>
      </div>

      {source.source_id ? <p className="sources-drawer__source-id">{source.source_id}</p> : null}
      {source.snippet ? <p className="sources-drawer__snippet">{source.snippet}</p> : null}

      {source.url ? (
        <a className="sources-drawer__link" href={source.url} rel="noreferrer noopener" target="_blank">
          Открыть источник
        </a>
      ) : null}
    </article>
  )
}

function SourcesDrawer({ sources, isOpen, onClose }) {
  if (!isOpen) return null

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
            <p>{sources.length} источников</p>
          </div>
          <button type="button" className="sources-drawer__close" aria-label="Закрыть источники" onClick={onClose}>
            ×
          </button>
        </header>

        <div className="sources-drawer__body">
          {sources.map((source, index) => (
            <SourceCard key={`${source.id}-${index}`} source={source} index={index} />
          ))}
        </div>
      </aside>
    </div>
  )
}

export default SourcesDrawer
