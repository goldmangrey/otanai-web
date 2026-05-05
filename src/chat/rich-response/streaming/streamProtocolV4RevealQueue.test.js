import assert from 'node:assert/strict'
import test from 'node:test'

import {
  eventDelayMs,
  planV4RevealEvents,
  splitMarkdownDeltaEvent
} from './streamProtocolV4RevealQueue.js'

test('splitMarkdownDeltaEvent preserves text order', () => {
  const events = splitMarkdownDeltaEvent(
    { type: 'markdown_delta', payload: { blockId: 'm1', text: 'abcdefghijklmnopqrstuvwxyz' } },
    5
  )

  assert.equal(events.map((event) => event.payload.text).join(''), 'abcdefghijklmnopqrstuvwxyz')
  assert.ok(events.length > 1)
})

test('planV4RevealEvents keeps table rows in order with structured delay', () => {
  const planned = planV4RevealEvents([
    { type: 'table_row', payload: { row: ['1'] } },
    { type: 'table_row', payload: { row: ['2'] } },
    { type: 'done', payload: {} }
  ])

  assert.deepEqual(planned.map((item) => item.event.payload.row?.[0] || item.event.type), ['1', '2', 'done'])
  assert.equal(planned[0].delayMs, 90)
  assert.equal(planned[2].delayMs, 0)
})

test('eventDelayMs is immediate for lifecycle events and delayed for deltas', () => {
  assert.equal(eventDelayMs({ type: 'message_start' }), 0)
  assert.equal(eventDelayMs({ type: 'done' }), 0)
  assert.equal(eventDelayMs({ type: 'markdown_delta' }), 28)
})
