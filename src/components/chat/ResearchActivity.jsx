import { useMemo, useState } from 'react'

import {
  getActivityDisplayLabel,
  normalizeActivity,
  shouldShowResearchActivity
} from '../../chat/utils/activity.js'
import { groupResearchActivity } from '../../chat/utils/activityGroups.js'

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

const COLLAPSED_VISIBLE_ITEMS = 3

function ResearchActivity({ metadata = null, compact = false }) {
  const [isOpen, setIsOpen] = useState(false)
  const [openGroups, setOpenGroups] = useState({})
  const activity = useMemo(() => normalizeActivity(metadata), [metadata])
  const groups = useMemo(() => groupResearchActivity(activity, metadata), [activity, metadata])
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

  const shouldCollapseGroups = activity.length > 6
  const toggleGroup = (groupId) => {
    setOpenGroups((value) => ({ ...value, [groupId]: !value[groupId] }))
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
        <div className="research-activity__groups">
          {(groups.length ? groups : [{ id: 'activity', label: displayLabel, count: activity.length, status: 'done', items: activity }]).map((group) => {
            const groupOpen = shouldCollapseGroups ? Boolean(openGroups[group.id]) : true
            const visibleItems = groupOpen ? group.items : group.items.slice(0, COLLAPSED_VISIBLE_ITEMS)
            return (
              <section key={group.id} className={`research-activity__group research-activity__group--${group.status}`}>
                <button
                  type="button"
                  className="research-activity__group-toggle"
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={groupOpen}
                >
                  <span>{group.label} · {group.count}</span>
                  <span className={`research-activity__status research-activity__status--${group.status}`}>
                    {statusLabel(group.status)}
                  </span>
                </button>
                {group.summary ? (
                  <div className="research-activity__summary" aria-label="Source selection summary">
                    {group.summary.reviewed ? <span>проверено {group.summary.reviewed}</span> : null}
                    {group.summary.used ? <span>использовано {group.summary.used}</span> : null}
                    {group.summary.official ? <span>официальных {group.summary.official}</span> : null}
                  </div>
                ) : null}
                <ol className="research-activity__timeline">
                  {visibleItems.map((item) => (
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
                {!groupOpen && group.items.length > visibleItems.length ? (
                  <button
                    type="button"
                    className="research-activity__group-more"
                    onClick={() => toggleGroup(group.id)}
                  >
                    Показать ещё {group.items.length - visibleItems.length}
                  </button>
                ) : null}
              </section>
            )
          })}
        </div>
      ) : null}
    </section>
  )
}

export default ResearchActivity
