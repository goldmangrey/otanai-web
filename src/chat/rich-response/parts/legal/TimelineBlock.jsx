import { normalizeTimelinePart } from './legalBlockUtils.js'

const STATUS_LABELS = {
  done: 'Выполнено',
  current: 'Сейчас',
  next: 'Далее',
  blocked: 'Требует данных'
}

function TimelineBlock({ part }) {
  const timeline = normalizeTimelinePart(part)

  return (
    <section className="otan-legal-block otan-timeline-block">
      <header className="otan-legal-block__header">
        <div>
          <span className="otan-legal-block__eyebrow">Маршрут</span>
          <h3 className="otan-legal-block__title">{timeline.title}</h3>
        </div>
      </header>
      <ol className="otan-timeline-block__items">
        {timeline.items.map((item, index) => (
          <li className={`otan-timeline-block__item otan-timeline-block__item--${item.status}`} key={`${item.text}-${index}`}>
            <div className="otan-timeline-block__marker" aria-hidden="true" />
            <div className="otan-timeline-block__content">
              <div className="otan-timeline-block__topline">
                <span>{item.label || `Шаг ${index + 1}`}</span>
                <span className={`otan-legal-block__badge otan-legal-block__badge--${item.status}`}>
                  {STATUS_LABELS[item.status] || STATUS_LABELS.next}
                </span>
              </div>
              <strong>{item.title || item.text}</strong>
              {item.text && item.title !== item.text ? <p>{item.text}</p> : null}
              {item.date ? <small>{item.date}</small> : null}
            </div>
          </li>
        ))}
      </ol>
    </section>
  )
}

export default TimelineBlock
