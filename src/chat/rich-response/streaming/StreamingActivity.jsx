import {
  normalizeStreamingActivity,
  shouldShowStreamingActivity
} from './streamingActivityUtils.js'

function StreamingActivity({ message = null, metadata = null, isStreaming = false }) {
  const inputMessage = message || { metadata, status: isStreaming ? 'loading' : 'sent' }
  if (!shouldShowStreamingActivity(inputMessage, { isStreaming })) return null

  const activity = normalizeStreamingActivity({
    ...inputMessage,
    metadata: inputMessage.metadata || metadata
  })

  return (
    <section className="otan-streaming-activity" role="status" aria-live="polite">
      <div className="otan-streaming-activity__headline">
        <span className="otan-streaming-activity__dot otan-streaming-activity__dot--current" aria-hidden="true" />
        <span>{activity.headline}</span>
      </div>
      {activity.items.length ? (
        <ul className="otan-streaming-activity__items">
          {activity.items.map((item, index) => {
            const isCurrent = index === activity.items.length - 1
            return (
              <li
                className={`otan-streaming-activity__item otan-streaming-activity__item--${isCurrent ? 'current' : 'done'}`}
                key={`${item.id}-${index}`}
              >
                <span className="otan-streaming-activity__dot" aria-hidden="true" />
                <span>{item.text}</span>
              </li>
            )
          })}
        </ul>
      ) : null}
      {activity.sourceCount || activity.quality ? (
        <div className="otan-streaming-activity__meta">
          {activity.sourceCount ? (
            <span className="otan-streaming-activity__source-count">
              Найдено источников: {activity.sourceCount}
            </span>
          ) : null}
          {activity.quality ? (
            <span className="otan-streaming-activity__quality">{activity.quality}</span>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

export default StreamingActivity
