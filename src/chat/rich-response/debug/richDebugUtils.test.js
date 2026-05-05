import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildRichDebugSummary,
  getDebugPartTypes,
  getPartSource,
  shouldRenderRichDebugBadge
} from './richDebugUtils.js'

test('detects metadata parts as source without exposing content', () => {
  const message = {
    id: 'msg_1',
    content: 'full answer text should not appear',
    metadata: {
      parts: [
        { type: 'markdown', text: 'secret answer' },
        { type: 'risk', text: 'risk text' }
      ]
    }
  }

  assert.equal(getPartSource(message), 'metadata.parts')
  assert.deepEqual(getDebugPartTypes(message), ['markdown', 'risk'])

  const summary = buildRichDebugSummary(message, {
    flags: {
      richRenderer: true,
      streamProtocolV4: true,
      designMode: true,
      playground: true,
      debugPanel: true,
      inlineSources: false
    },
    renderPhase: 'final'
  })

  assert.equal(summary.partsCount, 2)
  assert.equal(summary.partSource, 'metadata.parts')
  assert.equal(JSON.stringify(summary).includes('secret answer'), false)
})

test('falls back to metadata blocks or legacy content source', () => {
  assert.equal(getPartSource({ metadata: { blocks: [{ type: 'table' }] } }), 'metadata.blocks')
  assert.equal(getPartSource({ content: 'plain text' }), 'legacy content')
  assert.equal(getPartSource({}), 'none')
})

test('debug badge is hidden for user messages and normal chat by default', () => {
  assert.equal(shouldRenderRichDebugBadge({ role: 'user' }, { forceVisible: true, debugEnabled: true }), false)
  assert.equal(shouldRenderRichDebugBadge({ role: 'assistant' }, { debugEnabled: false }), false)
  assert.equal(shouldRenderRichDebugBadge({ role: 'assistant' }, { forceVisible: true }), true)
})
