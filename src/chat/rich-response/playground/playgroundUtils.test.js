import assert from 'node:assert/strict'
import test from 'node:test'

import { playgroundFixtures, v4RichLegalAnswerEvents } from './fixtures.js'
import {
  filterFixtures,
  getFixtureById,
  reduceV4Events,
  validatePlaygroundFixtures
} from './playgroundUtils.js'

test('playground fixtures have unique ids and required categories', () => {
  const result = validatePlaygroundFixtures(playgroundFixtures)

  assert.equal(result.valid, true, result.errors.join('\n'))
  for (const category of ['markdown', 'table', 'document', 'legal', 'sources', 'mixed', 'streaming', 'security']) {
    assert.ok(result.categories.includes(category), `Missing category ${category}`)
  }
})

test('fixture lookup and filtering are safe', () => {
  assert.equal(getFixtureById(playgroundFixtures, 'fixture_smart_table').category, 'table')
  assert.equal(getFixtureById(playgroundFixtures, 'missing').id, playgroundFixtures[0].id)
  assert.ok(filterFixtures(playgroundFixtures, 'document').every((fixture) => fixture.category === 'document'))
  assert.equal(filterFixtures(playgroundFixtures, 'all').length, playgroundFixtures.length)
})

test('security fixture contains unsafe URL cases intentionally', () => {
  const fixture = getFixtureById(playgroundFixtures, 'fixture_security_cases')
  const serialized = JSON.stringify(fixture)

  assert.match(serialized, /javascript:alert/)
  assert.match(serialized, /data:text\/html/)
})

test('v4 fixture events reduce without crash and finalize canonical parts', () => {
  const state = reduceV4Events(v4RichLegalAnswerEvents)

  assert.equal(state.status, 'sent')
  assert.ok(state.content.includes('Короткий вывод'))
  assert.deepEqual(state.parts.map((part) => part.type), [
    'markdown',
    'table',
    'legal_citation',
    'warning',
    'document_preview',
    'source_panel'
  ])
})
