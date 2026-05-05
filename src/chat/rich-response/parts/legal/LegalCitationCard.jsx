import { normalizeLegalCitationPart } from './legalBlockUtils.js'

const STATUS_LABELS = {
  active: 'Актуально',
  unknown: 'Не проверено',
  outdated: 'Требует проверки',
  draft: 'Черновик'
}

function LegalCitationCard({ part }) {
  const citation = normalizeLegalCitationPart(part)
  const statusLabel = STATUS_LABELS[citation.status] || citation.status

  return (
    <section className="otan-legal-block otan-legal-citation" aria-label="Правовое основание">
      <header className="otan-legal-block__header">
        <div>
          <span className="otan-legal-block__eyebrow">Правовое основание</span>
          <h3 className="otan-legal-block__title">{citation.title}</h3>
        </div>
        <div className="otan-legal-block__meta">
          <span className={`otan-legal-block__badge otan-legal-block__badge--${citation.status}`}>
            {statusLabel}
          </span>
          {citation.jurisdiction ? (
            <span className="otan-legal-block__badge">{citation.jurisdiction}</span>
          ) : null}
        </div>
      </header>

      <div className="otan-legal-block__body">
        {[citation.code, citation.article, citation.section].filter(Boolean).length ? (
          <p className="otan-legal-block__text">
            {[citation.code, citation.article, citation.section].filter(Boolean).join(' · ')}
          </p>
        ) : null}
        {citation.excerpt ? <p className="otan-legal-block__text">{citation.excerpt}</p> : null}
        {citation.usedFor ? (
          <p className="otan-legal-block__text">
            <strong>Использовано для:</strong> {citation.usedFor}
          </p>
        ) : null}
        {citation.updatedAt ? (
          <p className="otan-legal-block__text otan-legal-block__text--muted">
            Обновлено: {citation.updatedAt}
          </p>
        ) : null}
        {citation.url ? (
          <a className="otan-legal-block__link" href={citation.url} rel="noopener noreferrer" target="_blank">
            Открыть источник
          </a>
        ) : null}
      </div>
    </section>
  )
}

export default LegalCitationCard
