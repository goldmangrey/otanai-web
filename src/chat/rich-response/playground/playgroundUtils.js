import { applyV4StreamEvent, createV4StreamState } from '../streaming/streamProtocolV4.js'
import { normalizeMessage } from '../normalizeMessage.js'

export function getFixtureById(fixtures, id) {
  return fixtures.find((fixture) => fixture.id === id) || fixtures[0] || null
}

export function filterFixtures(fixtures, category) {
  if (!category || category === 'all') return fixtures
  return fixtures.filter((fixture) => fixture.category === category)
}

export function getUniqueFixtureIds(fixtures) {
  return new Set(fixtures.map((fixture) => fixture.id))
}

export function validatePlaygroundFixtures(fixtures) {
  const ids = getUniqueFixtureIds(fixtures)
  const categories = new Set()
  const errors = []

  if (ids.size !== fixtures.length) {
    errors.push('Fixture ids must be unique.')
  }

  fixtures.forEach((fixture) => {
    if (!fixture.id) errors.push('Fixture is missing id.')
    if (!fixture.category) errors.push(`${fixture.id || 'fixture'} is missing category.`)
    if (!fixture.message || fixture.message.role !== 'assistant') {
      errors.push(`${fixture.id || 'fixture'} must include assistant message.`)
    }
    categories.add(fixture.category)
  })

  return { valid: errors.length === 0, errors, categories: Array.from(categories) }
}

export function normalizeFixtureMessage(fixture, options = {}) {
  return normalizeMessage(fixture?.message || {}, {
    renderPhase: options.renderPhase || fixture?.renderPhase || ''
  })
}

export function reduceV4Events(events) {
  return events.reduce((state, event) => applyV4StreamEvent(state, event), createV4StreamState())
}

export function eventToDisplayName(event) {
  return String(event?.type || 'unknown')
}
