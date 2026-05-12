import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getCompletedAssistantActivityLabel,
  mergeAssistantActivityEvents,
  normalizeAssistantActivityEvent,
  normalizeAssistantActivityEvents
} from './assistantActivity.js'

function activity(overrides = {}) {
  return {
    type: 'assistant_activity',
    stage: 'adilet_search',
    message: 'Проверяю официальный источник на Әділет.',
    status: 'running',
    detail: 'Источник: О правах ребенка в Республике Казахстан',
    safe_to_show: true,
    order: 60,
    ...overrides
  }
}

test('normalizes safe assistant activity event', () => {
  const event = normalizeAssistantActivityEvent(activity())

  assert.equal(event.stage, 'adilet_search')
  assert.equal(event.message, 'Проверяю официальный источник на Әділет.')
  assert.equal(event.status, 'running')
  assert.equal(event.safe_to_show, true)
})

test('hides safeToShow false event', () => {
  assert.equal(normalizeAssistantActivityEvent(activity({ safeToShow: false })), null)
})

test('ignores technical event types', () => {
  assert.equal(
    normalizeAssistantActivityEvent({
      type: 'semantic_enrichment_done',
      payload: { message: 'semantic extraction finished', safeToShow: false }
    }),
    null
  )
})

test('filters forbidden visible text', () => {
  assert.equal(
    normalizeAssistantActivityEvent(activity({ message: 'raw qdrant payload recordsMatched' })),
    null
  )
})

test('dedupes by stage and order and keeps latest status', () => {
  const events = mergeAssistantActivityEvents(
    [activity({ status: 'running' })],
    [activity({ status: 'done' })]
  )

  assert.equal(events.length, 1)
  assert.equal(events[0].status, 'done')
})

test('sorts activity events by order', () => {
  const events = normalizeAssistantActivityEvents([
    activity({ stage: 'complete', message: 'Готово.', order: 100 }),
    activity({ stage: 'understand_query', message: 'Понимаю вопрос.', order: 10 })
  ])

  assert.deepEqual(events.map((event) => event.stage), ['understand_query', 'complete'])
})

test('uses compact completed label from public summary', () => {
  const label = getCompletedAssistantActivityLabel({
    assistantActivityPublicSummary: ['Понял вопрос', 'Проверил источники', 'Сформировал ответ']
  })

  assert.equal(label, 'Проверено: источник, нормы и ответ')
})

