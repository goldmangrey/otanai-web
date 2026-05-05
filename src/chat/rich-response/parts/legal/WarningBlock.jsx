import { normalizeWarningPart } from './legalBlockUtils.js'

function WarningBlock({ part }) {
  const warning = normalizeWarningPart(part)

  return (
    <section className={`otan-legal-block otan-warning-block otan-warning-block--${warning.variant}`}>
      <header className="otan-legal-block__header">
        <div>
          <span className="otan-legal-block__eyebrow">Предупреждение</span>
          <h3 className="otan-legal-block__title">{warning.title}</h3>
        </div>
        <span className={`otan-legal-block__badge otan-legal-block__badge--${warning.variant}`}>
          {warning.variant}
        </span>
      </header>
      <div className="otan-legal-block__body">
        {warning.text ? <p className="otan-legal-block__text">{warning.text}</p> : null}
        {warning.items.length ? (
          <ul className="otan-legal-block__items">
            {warning.items.map((item, index) => (
              <li className="otan-legal-block__item" key={`${item.text}-${index}`}>
                {item.text}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  )
}

export default WarningBlock
