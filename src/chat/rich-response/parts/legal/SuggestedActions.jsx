import { normalizeSuggestedActionsPart } from './legalBlockUtils.js'

function SuggestedActions({ part, onAction }) {
  const suggested = normalizeSuggestedActionsPart(part)

  function handleAction(action) {
    if (typeof onAction === 'function') onAction(action, { part: suggested })
  }

  return (
    <section className="otan-legal-block otan-suggested-actions">
      <header className="otan-legal-block__header">
        <div>
          <span className="otan-legal-block__eyebrow">Действия</span>
          <h3 className="otan-legal-block__title">{suggested.title}</h3>
        </div>
      </header>
      <div className="otan-legal-block__chips">
        {suggested.actions.map((action, index) => (
          <button
            className={`otan-action-chip otan-action-chip--${action.kind}`}
            type="button"
            disabled={action.disabled}
            key={`${action.value}-${index}`}
            onClick={() => handleAction(action)}
          >
            {action.label}
          </button>
        ))}
      </div>
    </section>
  )
}

export default SuggestedActions
