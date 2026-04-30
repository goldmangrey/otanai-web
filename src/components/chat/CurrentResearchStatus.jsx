import {
  getLatestLiveActivity,
  getLiveActivityDetail,
  getLiveActivityText,
  shouldShowCurrentResearchStatus
} from '../../chat/utils/activity.js'

function statusPrefix(item, metadata) {
  const mode = String(item?.mode || metadata?.activityMode || metadata?.mode || '').toLowerCase()
  if (mode === 'deep_research' || mode === 'deep-research') return 'Исследую'
  return 'Проверяю'
}

function CurrentResearchStatus({ metadata = null, status = '', isStreaming = false }) {
  if (!isStreaming && status !== 'loading') return null
  if (!shouldShowCurrentResearchStatus(metadata, status)) return null

  const item = getLatestLiveActivity(null, metadata)
  const text = getLiveActivityText(item)
  const detail = getLiveActivityDetail(item)
  if (!text) return null

  return (
    <div className="current-research-status" role="status" aria-live="polite">
      <span className="current-research-status__dot" aria-hidden="true" />
      <span className="current-research-status__body">
        <span className="current-research-status__text">
          <span className="current-research-status__prefix">{statusPrefix(item, metadata)}:</span> {text}
        </span>
        {detail ? <span className="current-research-status__detail">{detail}</span> : null}
      </span>
    </div>
  )
}

export default CurrentResearchStatus
