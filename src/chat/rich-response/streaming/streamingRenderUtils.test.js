import test from 'node:test'
import assert from 'node:assert/strict'

import {
  getFinalRenderKey,
  getMessageRenderPhase,
  getStableStreamingText,
  isMessageErrored,
  isMessageFinal,
  isMessageStreaming,
  shouldExtractDocumentFences,
  shouldRenderStructuredPartsDuringStream,
  shouldUseDraftNormalization
} from './streamingRenderUtils.js'

test('streaming statuses map to draft', () => {
  for (const status of ['loading', 'streaming', 'generating', 'pending']) {
    assert.equal(getMessageRenderPhase({ status }), 'draft')
    assert.equal(isMessageStreaming({ status }), true)
  }
})

test('final statuses map to final', () => {
  for (const status of ['sent', 'complete', 'completed', 'done', 'success']) {
    assert.equal(getMessageRenderPhase({ status }), 'final')
    assert.equal(isMessageFinal({ status }), true)
  }
})

test('error statuses map to error', () => {
  for (const status of ['error', 'failed', 'cancelled', 'aborted']) {
    assert.equal(getMessageRenderPhase({ status }), 'error')
    assert.equal(isMessageErrored({ status }), true)
  }
})

test('explicit render phase and isStreaming override status', () => {
  assert.equal(getMessageRenderPhase({ status: 'sent' }, { renderPhase: 'draft' }), 'draft')
  assert.equal(getMessageRenderPhase({ status: 'sent' }, { isStreaming: true }), 'draft')
})

test('missing status is safe final fallback', () => {
  assert.equal(getMessageRenderPhase({ content: 'Answer' }), 'final')
  assert.equal(getMessageRenderPhase(null), 'final')
})

test('draft helpers disable document extraction', () => {
  const message = { status: 'loading', content: '```document\nA\n```' }
  assert.equal(shouldUseDraftNormalization(message), true)
  assert.equal(shouldExtractDocumentFences(message), false)
})

test('structured parts render during stream only when typed parts exist', () => {
  assert.equal(shouldRenderStructuredPartsDuringStream({ status: 'loading' }), false)
  assert.equal(shouldRenderStructuredPartsDuringStream({ status: 'loading', parts: [{ type: 'table' }] }), true)
  assert.equal(shouldRenderStructuredPartsDuringStream({ status: 'sent' }), true)
})

test('stable text and final render key are deterministic', () => {
  assert.equal(getStableStreamingText(null), '')
  assert.match(getFinalRenderKey({ id: 'm1', status: 'sent', content: 'abc' }), /^m1:sent:3:/)
})
