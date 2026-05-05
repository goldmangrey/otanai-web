import {
  sourceFreshnessLabel,
  sourceStatusLabel,
  sourceTypeLabel
} from './sourceUtils.js'

function SourceBadge({ children, variant = 'default' }) {
  if (!children) return null
  return <span className={`otan-source-card__badge otan-source-card__badge--${variant}`}>{children}</span>
}

function SourceCard({ source, index = 0, compact = false }) {
  const meta = [source.code, source.article, source.section, source.jurisdiction].filter(Boolean)
  const freshnessDate = source.updatedAt
    ? `Проверено: ${source.updatedAt}`
    : source.retrievedAt
      ? `Получено: ${source.retrievedAt}`
      : ''

  return (
    <article className={`otan-source-card${compact ? ' otan-source-card--compact' : ''}`}>
      <header className="otan-source-card__header">
        <span className="otan-source-card__index">{index + 1}</span>
        <div className="otan-source-card__heading">
          <div className="otan-source-card__badges">
            <SourceBadge variant={source.sourceType}>{sourceTypeLabel(source.sourceType)}</SourceBadge>
            <SourceBadge variant={source.status}>{sourceStatusLabel(source.status)}</SourceBadge>
            <SourceBadge variant={source.freshness}>{sourceFreshnessLabel(source.freshness)}</SourceBadge>
          </div>
          <h3 className="otan-source-card__title">{source.title}</h3>
        </div>
      </header>

      {meta.length ? <p className="otan-source-card__meta">{meta.join(' · ')}</p> : null}
      {source.usedFor ? (
        <p className="otan-source-card__used-for">
          <strong>Использовано для:</strong> {source.usedFor}
        </p>
      ) : null}
      {source.excerpt ? <p className="otan-source-card__excerpt">{source.excerpt}</p> : null}
      {source.score !== null ? (
        <p className="otan-source-card__meta">Score: {Number(source.score).toFixed(2)}</p>
      ) : null}
      {freshnessDate ? <p className="otan-source-card__meta">{freshnessDate}</p> : null}

      {source.url ? (
        <div className="otan-source-card__actions">
          <a className="otan-source-card__link" href={source.url} rel="noopener noreferrer" target="_blank">
            Открыть источник
          </a>
        </div>
      ) : null}
    </article>
  )
}

export default SourceCard
