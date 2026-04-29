import { useMemo, useState } from 'react'

import {
  getActivityDisplayLabel,
  normalizeActivity,
  shouldShowResearchActivity
} from '../../chat/utils/activity.js'

function statusLabel(status) {
  switch (status) {
    case 'running':
      return 'в процессе'
    case 'pending':
      return 'ожидает'
    case 'skipped':
      return 'пропущено'
    case 'warning':
      return 'проверить'
    case 'error':
      return 'ошибка'
    default:
      return 'готово'
  }
}

function latestActiveItem(items) {
  return [...items].reverse().find((item) => ['running', 'pending'].includes(item.status)) || items.at(-1)
}

function ResearchActivity({ metadata = null, compact = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const activity = useMemo(() => normalizeActivity(metadata), [metadata])
  const shouldShow = useMemo(() => shouldShowResearchActivity(activity, metadata), [activity, metadata])
  const displayLabel = useMemo(() => getActivityDisplayLabel(activity, metadata), [activity, metadata])

  if (!shouldShow) return null

  if (compact) {
    const item = latestActiveItem(activity)
    return (
      <div className="research-activity research-activity--compact" aria-label="Research activity">
        <span className={`research-activity__dot research-activity__dot--${item.status}`} />
        <span>{item.label}...</span>
      </div>
    )
  }

  return (
    <section className="research-activity" aria-label="Research activity">
      <button
        className="research-activity__toggle"
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen}
      >
        <span>{displayLabel} · {activity.length}</span>
        <span aria-hidden="true">{isOpen ? 'Свернуть' : 'Показать'}</span>
      </button>
      {isOpen ? (
        <ol className="research-activity__timeline">
          {activity.map((item) => (
            <li key={item.id} className="research-activity__item">
              <span className={`research-activity__dot research-activity__dot--${item.status}`} />
              <div className="research-activity__content">
                <div className="research-activity__header">
                  <strong className="research-activity__label">{item.label}</strong>
                  <span className={`research-activity__status research-activity__status--${item.status}`}>
                    {statusLabel(item.status)}
                  </span>
                </div>
                {item.detail ? <p className="research-activity__detail">{item.detail}</p> : null}
                {item.source_domains.length ? (
                  <div className="research-activity__domains">
                    {item.source_domains.map((domain) => (
                      <span key={`${item.id}-${domain}`}>{domain}</span>
                    ))}
                  </div>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  )
}

export default ResearchActivity
