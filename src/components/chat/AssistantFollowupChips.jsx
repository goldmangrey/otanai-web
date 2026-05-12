import { useMemo } from 'react'

import { normalizeFollowupSuggestions } from '../../chat/utils/followups.js'

function AssistantFollowupChips({
  followups = [],
  metadata = null,
  disabled = false,
  onSelect = null
}) {
  const suggestions = useMemo(
    () => normalizeFollowupSuggestions(followups.length ? followups : metadata),
    [followups, metadata]
  )

  if (!suggestions.length) return null

  return (
    <section className="assistant-followups" aria-label="Следующие вопросы">
      <div className="assistant-followups__chips">
        {suggestions.map((suggestion) => (
          <button
            type="button"
            className={`assistant-followups__chip assistant-followups__chip--${suggestion.type}`}
            key={`${suggestion.label}:${suggestion.query}`}
            onClick={() => onSelect?.(suggestion.query)}
            disabled={disabled}
          >
            {suggestion.label}
          </button>
        ))}
      </div>
    </section>
  )
}

export default AssistantFollowupChips

