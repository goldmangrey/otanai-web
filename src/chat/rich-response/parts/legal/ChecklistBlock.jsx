import { normalizeChecklistPart } from './legalBlockUtils.js'

function ChecklistBlock({ part }) {
  const checklist = normalizeChecklistPart(part)

  return (
    <section className="otan-legal-block otan-checklist-block">
      <header className="otan-legal-block__header">
        <div>
          <span className="otan-legal-block__eyebrow">Чеклист</span>
          <h3 className="otan-legal-block__title">{checklist.title}</h3>
        </div>
      </header>
      <ul className="otan-checklist-block__items">
        {checklist.items.map((item, index) => (
          <li className="otan-checklist-block__item" key={`${item.text}-${index}`}>
            <span className="otan-checklist-block__box" aria-hidden="true">
              {item.checked ? '✓' : ''}
            </span>
            <span>
              {item.text}
              {item.hint ? <small>{item.hint}</small> : null}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default ChecklistBlock
