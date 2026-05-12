import { useMemo, useState } from 'react'

import {
  getCompletedAssistantActivityLabel,
  getLatestAssistantActivity,
  normalizeAssistantActivityEvents
} from '../../chat/utils/assistantActivity.js'

function statusIcon(status) {
  switch (status) {
    case 'done':
      return '✓'
    case 'warning':
      return '!'
    case 'error':
      return '!'
    case 'skipped':
      return '•'
    default:
      return '•'
  }
}

function statusLabel(status) {
  switch (status) {
    case 'running':
      return 'в процессе'
    case 'pending':
      return 'ожидает'
    case 'warning':
      return 'нужно проверить'
    case 'error':
      return 'ошибка'
    case 'skipped':
      return 'пропущено'
    default:
      return 'готово'
  }
}

function AssistantActivityPanel({ events }) {
  return (
    <div className="assistant-activity-panel" role="region" aria-label="Ход подготовки ответа">
      <ol className="assistant-activity-panel__list">
        {events.map((event) => (
          <li
            className={`assistant-activity-panel__item assistant-activity-panel__item--${event.status}`}
            key={`${event.stage}-${event.order}`}
          >
            <span className="assistant-activity-panel__icon" aria-hidden="true">
              {statusIcon(event.status)}
            </span>
            <div className="assistant-activity-panel__content">
              <div className="assistant-activity-panel__row">
                <span className="assistant-activity-panel__message">{event.message}</span>
                <span className={`assistant-activity-panel__status assistant-activity-panel__status--${event.status}`}>
                  {statusLabel(event.status)}
                </span>
              </div>
              {event.detail ? (
                <p className="assistant-activity-panel__detail">{event.detail}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

function AssistantActivityPill({
  events = [],
  metadata = null,
  isStreaming = false,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false)
  const normalizedEvents = useMemo(
    () => normalizeAssistantActivityEvents(events.length ? events : metadata),
    [events, metadata]
  )

  if (!normalizedEvents.length) return null

  const latest = getLatestAssistantActivity(normalizedEvents)
  const displayText = isStreaming
    ? latest?.message || 'Готовлю ответ...'
    : getCompletedAssistantActivityLabel(metadata, normalizedEvents)
  const completedStatus = normalizedEvents.some((event) => event.status === 'error')
    ? 'error'
    : normalizedEvents.some((event) => event.status === 'warning')
      ? 'warning'
      : 'done'
  const status = isStreaming ? latest?.status || 'running' : completedStatus

  return (
    <div className={`assistant-activity ${className}`.trim()}>
      <button
        type="button"
        className={`assistant-activity-pill assistant-activity-pill--${status}`}
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
      >
        <span
          className={`assistant-activity-pill__dot assistant-activity-pill__dot--${status}`}
          aria-hidden="true"
        >
          {status === 'done' ? '✓' : ''}
        </span>
        <span className="assistant-activity-pill__text">{displayText}</span>
        <span className="assistant-activity-pill__chevron" aria-hidden="true">
          {isOpen ? 'Свернуть' : 'Детали'}
        </span>
      </button>
      {isOpen ? <AssistantActivityPanel events={normalizedEvents} /> : null}
    </div>
  )
}

export { AssistantActivityPanel }
export default AssistantActivityPill
