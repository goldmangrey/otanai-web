import { normalizeMissingInfoPart } from './legalBlockUtils.js'

function MissingInfoBlock({ part, onAction }) {
  const missingInfo = normalizeMissingInfoPart(part)

  function handleQuestion(question) {
    if (typeof onAction === 'function') onAction(question, { part: missingInfo })
  }

  return (
    <section className="otan-legal-block otan-missing-info-block">
      <header className="otan-legal-block__header">
        <div>
          <span className="otan-legal-block__eyebrow">Не хватает данных</span>
          <h3 className="otan-legal-block__title">{missingInfo.title}</h3>
        </div>
      </header>
      {missingInfo.items.length ? (
        <ul className="otan-legal-block__items">
          {missingInfo.items.map((item, index) => (
            <li className="otan-legal-block__item" key={`${item.text}-${index}`}>
              {item.text}
            </li>
          ))}
        </ul>
      ) : null}
      {missingInfo.questions.length ? (
        <div className="otan-legal-block__chips">
          {missingInfo.questions.map((question, index) => (
            <button
              className="otan-action-chip"
              type="button"
              key={`${question.value}-${index}`}
              onClick={() => handleQuestion(question)}
            >
              {question.label}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  )
}

export default MissingInfoBlock
