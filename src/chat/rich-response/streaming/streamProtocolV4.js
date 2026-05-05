const LEGAL_EVENT_TYPES = {
  legal_citation_add: 'legal_citation',
  warning_add: 'warning',
  risk_add: 'risk',
  checklist_add: 'checklist',
  timeline_add: 'timeline',
  missing_info_add: 'missing_info',
  suggested_actions_add: 'suggested_actions',
  legal_disclaimer_add: 'legal_disclaimer'
}

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function asArray(value) {
  return Array.isArray(value) ? value : []
}

function cleanString(value) {
  return String(value ?? '').trim()
}

function upsertPart(parts, nextPart) {
  if (!nextPart?.type) return parts
  const id = nextPart.id || nextPart.blockId
  if (!id) return [...parts, nextPart]
  const index = parts.findIndex((part) => part.id === id)
  if (index === -1) return [...parts, nextPart]
  return parts.map((part, partIndex) => (partIndex === index ? { ...part, ...nextPart } : part))
}

function appendSourcePanelPart(parts, source) {
  const index = parts.findIndex((part) => part.type === 'source_panel')
  if (index === -1) {
    return [...parts, { id: 'part_sources_stream', type: 'source_panel', title: 'Источники', sources: [source] }]
  }
  return parts.map((part, partIndex) =>
    partIndex === index ? { ...part, sources: [...asArray(part.sources), source] } : part
  )
}

function mergeMetadata(metadata, patch) {
  return {
    ...asObject(metadata),
    ...asObject(patch)
  }
}

export function createV4StreamState(initial = {}) {
  const source = asObject(initial)
  return {
    messageId: source.messageId || null,
    requestId: source.requestId || null,
    content: source.content || '',
    parts: asArray(source.parts),
    metadata: asObject(source.metadata),
    openBlocks: asObject(source.openBlocks),
    sources: asArray(source.sources),
    status: source.status || 'loading',
    error: source.error || ''
  }
}

export function applyV4StreamEvent(state, event) {
  const current = createV4StreamState(state)
  const source = asObject(event)
  const type = cleanString(source.type)
  const payload = asObject(source.payload)

  switch (type) {
    case 'message_start':
      return {
        ...current,
        messageId: payload.messageId || current.messageId,
        requestId: payload.requestId || current.requestId,
        metadata: mergeMetadata(current.metadata, {
          requestId: payload.requestId,
          protocolVersion: payload.protocolVersion || 4
        }),
        status: 'loading'
      }
    case 'markdown_delta':
      return appendMarkdownDelta(current, payload)
    case 'table_start':
      return startTablePart(current, payload)
    case 'table_row':
      return appendTableRow(current, payload)
    case 'table_end':
      return endTablePart(current, payload)
    case 'source_add':
      return appendSource(current, payload)
    case 'document_preview':
      return appendDocumentPreviewPart(current, payload)
    case 'done':
      return finalizeV4Message(current, payload)
    case 'error':
      return {
        ...current,
        status: 'error',
        error: cleanString(payload.message) || 'The streaming request failed.'
      }
    default:
      if (LEGAL_EVENT_TYPES[type]) return appendLegalPart(current, type, payload)
      return current
  }
}

export function v4EventToMessagePatch(event, state) {
  const nextState = applyV4StreamEvent(state, event)
  return {
    content: nextState.content,
    parts: nextState.parts,
    metadata: nextState.metadata,
    status: nextState.status,
    error: nextState.error,
    retryable: nextState.status === 'error'
  }
}

export function appendMarkdownDelta(state, payload) {
  const blockId = cleanString(payload.blockId) || 'part_markdown_stream'
  const text = String(payload.text ?? '')
  const existing = state.parts.find((part) => part.id === blockId) || { id: blockId, type: 'markdown', text: '' }
  const nextPart = { ...existing, type: 'markdown', text: `${existing.text || ''}${text}` }
  return {
    ...state,
    content: `${state.content || ''}${text}`,
    parts: upsertPart(state.parts, nextPart),
    status: 'loading'
  }
}

export function startTablePart(state, payload) {
  const blockId = cleanString(payload.blockId) || 'part_table_stream'
  const tablePart = {
    id: blockId,
    type: 'table',
    title: cleanString(payload.title),
    caption: cleanString(payload.caption),
    columns: asArray(payload.columns),
    rows: []
  }
  return {
    ...state,
    parts: upsertPart(state.parts, tablePart),
    openBlocks: { ...state.openBlocks, [blockId]: { type: 'table' } },
    status: 'loading'
  }
}

export function appendTableRow(state, payload) {
  const blockId = cleanString(payload.blockId)
  if (!blockId) return state
  const nextParts = state.parts.map((part) =>
    part.id === blockId && part.type === 'table'
      ? { ...part, rows: [...asArray(part.rows), asArray(payload.row)] }
      : part
  )
  return { ...state, parts: nextParts, status: 'loading' }
}

export function endTablePart(state, payload) {
  const blockId = cleanString(payload.blockId)
  if (!blockId) return state
  const { [blockId]: _closed, ...openBlocks } = state.openBlocks
  return { ...state, openBlocks, status: 'loading' }
}

export function appendLegalPart(state, eventType, payload) {
  const type = LEGAL_EVENT_TYPES[eventType]
  const part = { ...asObject(payload.part || payload), type }
  return {
    ...state,
    parts: [...state.parts, part],
    status: 'loading'
  }
}

export function appendDocumentPreviewPart(state, payload) {
  const part = asObject(payload.part)
  const document = asObject(payload.document)
  return {
    ...state,
    parts: [...state.parts, { ...part, type: 'document_preview', document: part.document || document }],
    status: 'loading'
  }
}

export function appendSource(state, payload) {
  const source = asObject(payload.source)
  if (!Object.keys(source).length) return state
  const sources = [...state.sources, source]
  return {
    ...state,
    sources,
    metadata: mergeMetadata(state.metadata, { sources, citations: sources }),
    parts: appendSourcePanelPart(state.parts, source),
    status: 'loading'
  }
}

export function finalizeV4Message(state, donePayload) {
  const metadata = mergeMetadata(state.metadata, donePayload.metadata)
  const finalParts = asArray(metadata.parts).length ? metadata.parts : state.parts
  return {
    ...state,
    content: String(donePayload.assistantText ?? state.content ?? ''),
    parts: finalParts,
    metadata: {
      ...metadata,
      parts: finalParts
    },
    status: 'sent',
    error: ''
  }
}

export function partsToAssistantContent(parts, fallbackText = '') {
  const text = asArray(parts)
    .filter((part) => asObject(part).type === 'markdown')
    .map((part) => String(asObject(part).text || ''))
    .join('')
  return text || String(fallbackText || '')
}
