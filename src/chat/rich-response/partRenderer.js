import { createElement } from 'react'
import { PART_TYPES } from './partTypes.js'
import OtanMarkdown from './markdown/OtanMarkdown.jsx'
import OtanDocumentPreview from './parts/OtanDocumentPreview.jsx'
import OtanSmartTable from './parts/OtanSmartTable.jsx'
import {
  ChecklistBlock,
  LegalCitationCard,
  LegalDisclaimer,
  MissingInfoBlock,
  RiskBlock,
  SuggestedActions,
  TimelineBlock,
  WarningBlock
} from './parts/legal/index.js'
import { SourcePanel } from './parts/sources/index.js'

function UnknownPartFallback() {
  return null
}

function metadataWithoutBlocks(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return metadata
  const { blocks: _blocks, ...rest } = metadata
  return rest
}

export function renderPart(part, context = {}) {
  if (!part || typeof part !== 'object') return null

  switch (part.type) {
    case PART_TYPES.MARKDOWN:
      return createElement(OtanMarkdown, {
        text: part.text || '',
        isStreaming: Boolean(context.isStreaming),
        renderPhase: context.renderPhase,
        documentContext: metadataWithoutBlocks(context.metadata)
      })
    case PART_TYPES.TABLE:
      return createElement(OtanSmartTable, {
        part,
        isStreaming: Boolean(context.isStreaming),
        renderPhase: context.renderPhase
      })
    case PART_TYPES.DOCUMENT_PREVIEW:
      return createElement(OtanDocumentPreview, {
        part,
        isStreaming: Boolean(context.isStreaming),
        renderPhase: context.renderPhase
      })
    case PART_TYPES.LEGAL_CITATION:
      return createElement(LegalCitationCard, {
        part,
        isStreaming: Boolean(context.isStreaming)
      })
    case PART_TYPES.WARNING:
      return createElement(WarningBlock, {
        part,
        isStreaming: Boolean(context.isStreaming)
      })
    case PART_TYPES.RISK:
      return createElement(RiskBlock, {
        part,
        isStreaming: Boolean(context.isStreaming)
      })
    case PART_TYPES.CHECKLIST:
      return createElement(ChecklistBlock, {
        part,
        isStreaming: Boolean(context.isStreaming)
      })
    case PART_TYPES.TIMELINE:
      return createElement(TimelineBlock, {
        part,
        isStreaming: Boolean(context.isStreaming)
      })
    case PART_TYPES.MISSING_INFO:
      return createElement(MissingInfoBlock, {
        part,
        isStreaming: Boolean(context.isStreaming),
        onAction: context.onAction
      })
    case PART_TYPES.SUGGESTED_ACTIONS:
      return createElement(SuggestedActions, {
        part,
        isStreaming: Boolean(context.isStreaming),
        onAction: context.onAction
      })
    case PART_TYPES.LEGAL_DISCLAIMER:
      return createElement(LegalDisclaimer, {
        part,
        isStreaming: Boolean(context.isStreaming)
      })
    case PART_TYPES.SOURCE_PANEL:
      if (context.renderSourcePanel !== true) return null
      return createElement(SourcePanel, {
        part,
        compact: Boolean(context.compactSources),
        collapsible: true,
        defaultCollapsed: Boolean(context.defaultSourcesCollapsed)
      })
    default:
      return createElement(UnknownPartFallback)
  }
}
