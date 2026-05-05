import assert from 'node:assert/strict'
import test from 'node:test'

import {
  applyV4StreamEvent,
  createV4StreamState,
  partsToAssistantContent
} from './streamProtocolV4.js'

test('message_start initializes stream state', () => {
  const state = applyV4StreamEvent(createV4StreamState(), {
    type: 'message_start',
    payload: { messageId: 'msg_1', requestId: 'req_1', protocolVersion: 4 }
  })

  assert.equal(state.messageId, 'msg_1')
  assert.equal(state.requestId, 'req_1')
  assert.equal(state.metadata.protocolVersion, 4)
})

test('markdown_delta appends content and markdown part text', () => {
  let state = createV4StreamState()
  state = applyV4StreamEvent(state, { type: 'markdown_delta', payload: { blockId: 'm1', text: 'Hello ' } })
  state = applyV4StreamEvent(state, { type: 'markdown_delta', payload: { blockId: 'm1', text: 'world' } })

  assert.equal(state.content, 'Hello world')
  assert.deepEqual(state.parts, [{ id: 'm1', type: 'markdown', text: 'Hello world' }])
})

test('table events build progressive table part', () => {
  let state = createV4StreamState()
  state = applyV4StreamEvent(state, { type: 'table_start', payload: { blockId: 't1', title: 'Риски', columns: ['A'] } })
  state = applyV4StreamEvent(state, { type: 'table_row', payload: { blockId: 't1', row: ['B'] } })
  state = applyV4StreamEvent(state, { type: 'table_end', payload: { blockId: 't1' } })

  assert.equal(state.parts[0].type, 'table')
  assert.deepEqual(state.parts[0].rows, [['B']])
  assert.deepEqual(state.openBlocks, {})
})

test('source_add updates metadata and source panel part', () => {
  const state = applyV4StreamEvent(createV4StreamState(), {
    type: 'source_add',
    payload: { source: { title: 'ГК РК' } }
  })

  assert.equal(state.metadata.sources[0].title, 'ГК РК')
  assert.equal(state.parts[0].type, 'source_panel')
  assert.equal(Object.prototype.hasOwnProperty.call(state, 'drawerOpen'), false)
})

test('legal and document events append typed parts', () => {
  let state = createV4StreamState()
  state = applyV4StreamEvent(state, { type: 'legal_citation_add', payload: { part: { title: 'ГК РК' } } })
  state = applyV4StreamEvent(state, { type: 'warning_add', payload: { part: { text: 'Важно' } } })
  state = applyV4StreamEvent(state, { type: 'risk_add', payload: { part: { text: 'Риск' } } })
  state = applyV4StreamEvent(state, { type: 'checklist_add', payload: { part: { items: ['A'] } } })
  state = applyV4StreamEvent(state, { type: 'document_preview', payload: { document: { title: 'Doc' } } })

  assert.deepEqual(state.parts.map((part) => part.type), [
    'legal_citation',
    'warning',
    'risk',
    'checklist',
    'document_preview'
  ])
})

test('done prefers canonical metadata parts and assistantText', () => {
  const initial = applyV4StreamEvent(createV4StreamState(), {
    type: 'markdown_delta',
    payload: { blockId: 'draft', text: 'Draft' }
  })
  const state = applyV4StreamEvent(initial, {
    type: 'done',
    payload: {
      assistantText: 'Final',
      metadata: {
        parts: [{ id: 'final', type: 'markdown', text: 'Final' }]
      }
    }
  })

  assert.equal(state.status, 'sent')
  assert.equal(state.content, 'Final')
  assert.deepEqual(state.parts, [{ id: 'final', type: 'markdown', text: 'Final' }])
})

test('invalid and error events are safe', () => {
  const state = applyV4StreamEvent(createV4StreamState(), { type: 'unknown', payload: { value: 1 } })
  assert.deepEqual(state.parts, [])

  const errorState = applyV4StreamEvent(state, { type: 'error', payload: { message: 'Failed' } })
  assert.equal(errorState.status, 'error')
  assert.equal(errorState.error, 'Failed')
})

test('partsToAssistantContent returns markdown text or fallback', () => {
  assert.equal(partsToAssistantContent([{ type: 'markdown', text: 'Hello' }]), 'Hello')
  assert.equal(partsToAssistantContent([], 'Fallback'), 'Fallback')
})
