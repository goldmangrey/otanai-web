import { normalizeRiskPart } from './legalBlockUtils.js'

const RISK_LABELS = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  danger: 'Критичный',
  neutral: 'Не указан'
}

function RiskBlock({ part }) {
  const risk = normalizeRiskPart(part)

  return (
    <section className={`otan-legal-block otan-risk-block otan-risk-block--${risk.level}`}>
      <header className="otan-legal-block__header">
        <div>
          <span className="otan-legal-block__eyebrow">Оценка риска</span>
          <h3 className="otan-legal-block__title">{risk.title}</h3>
        </div>
        <span className={`otan-legal-block__badge otan-legal-block__badge--risk-${risk.level}`}>
          {RISK_LABELS[risk.level] || RISK_LABELS.neutral}
        </span>
      </header>
      <div className="otan-legal-block__body">
        {risk.text ? <p className="otan-legal-block__text">{risk.text}</p> : null}
        {risk.items.length ? (
          <div className="otan-risk-block__items">
            {risk.items.map((item, index) => (
              <article className="otan-risk-block__item" key={`${item.text}-${index}`}>
                <div className="otan-risk-block__item-header">
                  <strong>{item.title || `Риск ${index + 1}`}</strong>
                  <span className={`otan-legal-block__badge otan-legal-block__badge--risk-${item.level}`}>
                    {RISK_LABELS[item.level] || RISK_LABELS.neutral}
                  </span>
                </div>
                <p>{item.text}</p>
                {item.mitigation ? <p className="otan-legal-block__text--muted">{item.mitigation}</p> : null}
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}

export default RiskBlock
