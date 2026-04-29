import { useI18n } from '../../i18n/useI18n.js'

function EmptyState({ suggestions, onSelectSuggestion }) {
  const { t } = useI18n()

  return (
    <div className="chat-empty-state">
      <div className="chat-empty-state__panel">
        <div className="chat-empty-state__orb" aria-hidden="true">
          <span />
        </div>

        <div className="chat-empty-state__content">
          <div className="chat-empty-state__eyebrow">{t('emptyEyebrow')}</div>
          <h1>{t('emptyTitle')}</h1>
          <p>{t('emptyText')}</p>

          <div className="chat-empty-state__suggestions">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion}
                className="chat-empty-state__suggestion"
                type="button"
                onClick={() => onSelectSuggestion(suggestion)}
              >
                <span className="chat-empty-state__suggestion-label">{t('quickStart')}</span>
                <span>{suggestion}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmptyState
