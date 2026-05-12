import assert from 'node:assert/strict'
import test from 'node:test'

import { normalizeFollowupSuggestion, normalizeFollowupSuggestions } from './followups.js'

test('normalizes safe followup suggestion', () => {
  const item = normalizeFollowupSuggestion({
    label: 'Составить жалобу',
    query: 'Составь жалобу в управление образования',
    type: 'draft',
    priority: 10,
    safe_to_show: true
  })

  assert.equal(item.label, 'Составить жалобу')
  assert.equal(item.query, 'Составь жалобу в управление образования')
  assert.equal(item.type, 'draft')
})

test('hides safeToShow false followup', () => {
  assert.equal(
    normalizeFollowupSuggestion({
      label: 'Debug',
      query: 'Debug',
      safeToShow: false
    }),
    null
  )
})

test('filters forbidden followup text', () => {
  assert.equal(
    normalizeFollowupSuggestion({
      label: 'raw qdrant payload',
      query: 'recordsMatched'
    }),
    null
  )
})

test('normalizes metadata followups and limits to five', () => {
  const suggestions = normalizeFollowupSuggestions({
    assistantFollowups: Array.from({ length: 7 }).map((_, index) => ({
      label: `Шаг ${index + 1}`,
      query: `Вопрос ${index + 1}`,
      type: 'practical',
      priority: index
    }))
  })

  assert.equal(suggestions.length, 5)
  assert.equal(suggestions[0].label, 'Шаг 1')
})

test('dedupes repeated followups', () => {
  const suggestions = normalizeFollowupSuggestions([
    { label: 'Подать через eOtinish', query: 'Как подать через eOtinish' },
    { label: 'Подать через eOtinish', query: 'Как подать через eOtinish' }
  ])

  assert.equal(suggestions.length, 1)
})

test('does not infer followups from markdown body content', () => {
  const suggestions = normalizeFollowupSuggestions({
    content: '## Что можно сделать дальше\nМогу составить жалобу в управление образования.'
  })

  assert.deepEqual(suggestions, [])
})

test('missing followups do not break normalization', () => {
  assert.deepEqual(normalizeFollowupSuggestions(null), [])
  assert.deepEqual(normalizeFollowupSuggestions({ metadata: {} }), [])
})
