import { useMemo, useState } from 'react'
import OtanMessage from '../OtanMessage.jsx'
import { normalizeMessage } from '../normalizeMessage.js'

function PlaygroundMessagePreview({
  fixture,
  message,
  renderPhase,
  renderSourcePanel,
  previewWidth
}) {
  const [actionLog, setActionLog] = useState([])
  const normalized = useMemo(
    () => normalizeMessage(message, { renderPhase: renderPhase || fixture?.renderPhase || '' }),
    [fixture, message, renderPhase]
  )
  const widthClass = `rich-playground__preview--${previewWidth}`

  function handleAction(action, context) {
    setActionLog((items) => [
      {
        label: action?.label || action?.value || 'action',
        partType: context?.part?.type || 'unknown',
        ts: new Date().toISOString()
      },
      ...items
    ].slice(0, 6))
  }

  return (
    <div className="rich-playground__preview-grid">
      <section className={`rich-playground__preview ${widthClass}`}>
        <div className="rich-playground__preview-shell">
          <OtanMessage
            message={message}
            renderPhase={renderPhase || fixture?.renderPhase || ''}
            renderSourcePanel={renderSourcePanel}
            compactSources={previewWidth !== 'desktop'}
            onAction={handleAction}
            showDebug
            defaultSourcesCollapsed
          />
        </div>
      </section>

      <aside className="rich-playground__inspectors">
        <section>
          <h2>Expected</h2>
          <p>{fixture?.notes || 'No notes.'}</p>
          <p>Parts: {normalized.parts?.length || 0}</p>
          <p>Status: {message.status || 'unknown'}</p>
        </section>

        <section>
          <h2>Action log</h2>
          {actionLog.length ? (
            <ul>
              {actionLog.map((item) => (
                <li key={`${item.ts}-${item.label}`}>{item.label} · {item.partType}</li>
              ))}
            </ul>
          ) : (
            <p>No actions yet.</p>
          )}
        </section>

        <section>
          <h2>Normalized parts</h2>
          <pre>{JSON.stringify(normalized.parts || [], null, 2)}</pre>
        </section>

        <section>
          <h2>Raw message</h2>
          <pre>{JSON.stringify(message, null, 2)}</pre>
        </section>
      </aside>
    </div>
  )
}

export default PlaygroundMessagePreview
