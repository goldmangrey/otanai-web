import { normalizeMessage } from './normalizeMessage.js'
import { renderPart } from './partRenderer.js'
import ResearchActivity from '../../components/chat/ResearchActivity.jsx'
import {
  getMessageRenderPhase,
  isMessageStreaming
} from './streaming/streamingRenderUtils.js'
import RichRendererDebugBadge from './debug/RichRendererDebugBadge.jsx'
import {
  logNormalizeMessageError,
  logPartRenderError
} from './observability/richRendererLogger.js'

function OtanMessage({
  message = null,
  content = '',
  metadata = null,
  showResearchActivity = true,
  isStreaming = false,
  onAction = null,
  renderSourcePanel = false,
  compactSources = false,
  renderPhase = '',
  showDebug = false,
  defaultSourcesCollapsed = true
}) {
  const inputMessage = message || { content, metadata }
  const resolvedRenderPhase = getMessageRenderPhase(inputMessage, {
    renderPhase,
    isStreaming
  })
  let normalizedMessage
  try {
    normalizedMessage = normalizeMessage(inputMessage, {
      renderPhase: resolvedRenderPhase,
      isStreaming: resolvedRenderPhase === 'draft'
    })
  } catch (error) {
    logNormalizeMessageError(error, {
      message: inputMessage,
      renderPhase: resolvedRenderPhase,
      source: 'OtanMessage'
    })
    throw error
  }
  const resolvedMetadata = normalizedMessage.metadata || metadata
  const parts = Array.isArray(normalizedMessage.parts) ? normalizedMessage.parts : []
  const resolvedIsStreaming =
    Boolean(isStreaming) ||
    resolvedRenderPhase === 'draft' ||
    isMessageStreaming(normalizedMessage)

  return (
    <div className={`otan-message otan-message--${resolvedRenderPhase}`} data-render-phase={resolvedRenderPhase}>
      {parts.map((part, index) => {
        let renderedPart
        try {
          renderedPart = renderPart(part, {
            message: normalizedMessage,
            metadata: resolvedMetadata,
            isStreaming: resolvedIsStreaming,
            renderPhase: resolvedRenderPhase,
            onAction,
            renderSourcePanel,
            compactSources,
            defaultSourcesCollapsed
          })
        } catch (error) {
          logPartRenderError(error, {
            message: normalizedMessage,
            renderPhase: resolvedRenderPhase,
            source: part?.type || 'unknown'
          })
          throw error
        }
        if (!renderedPart) return null
        return (
          <div key={part.id || `${part.type || 'part'}-${index}`}>
            {renderedPart}
          </div>
        )
      })}
      {showResearchActivity ? <ResearchActivity metadata={resolvedMetadata} /> : null}
      <RichRendererDebugBadge
        message={inputMessage}
        renderPhase={resolvedRenderPhase}
        renderSourcePanel={renderSourcePanel}
        forceVisible={showDebug}
      />
    </div>
  )
}

export default OtanMessage
