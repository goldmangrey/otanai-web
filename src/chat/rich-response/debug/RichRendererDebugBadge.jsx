import { shouldShowRichDebugPanel } from '../../../config/richResponseFlags.js'
import { buildRichDebugSummary, shouldRenderRichDebugBadge } from './richDebugUtils.js'

function formatBoolean(value) {
  return value ? 'ON' : 'OFF'
}

function RichRendererDebugBadge({
  message,
  renderPhase = '',
  renderSourcePanel = false,
  fallback = false,
  forceVisible = false
}) {
  if (!shouldRenderRichDebugBadge(message, {
    forceVisible,
    debugEnabled: shouldShowRichDebugPanel()
  })) return null

  const summary = buildRichDebugSummary(message, {
    renderPhase,
    renderSourcePanel,
    fallback
  })

  return (
    <details className="otan-rich-debug">
      <summary>Debug</summary>
      <div aria-label="Rich renderer debug">
        <span>Rich: {formatBoolean(summary.richRenderer)}</span>
        <span>v4: {formatBoolean(summary.streamProtocolV4)}</span>
        <span>design: {formatBoolean(summary.designMode)}</span>
        <span>phase: {summary.renderPhase}</span>
        <span>status: {summary.status}</span>
        <span>parts: {summary.partsCount}</span>
        <span>source: {summary.partSource}</span>
        <span>inline sources: {formatBoolean(summary.inlineSources)}</span>
        {fallback ? <span>fallback: legacy</span> : null}
      </div>
    </details>
  )
}

export default RichRendererDebugBadge
