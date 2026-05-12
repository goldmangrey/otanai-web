import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getLatestAssistantConversationContext,
  normalizeAssistantConversationContext
} from './conversationContext.js'

test('normalizes compact assistant conversation context', () => {
  const context = normalizeAssistantConversationContext({
    last_domain: 'labor',
    last_strategy_type: 'practical_steps',
    last_source_titles: ['Трудовой кодекс Республики Казахстан'],
    confidence: 'high'
  })

  assert.equal(context.last_domain, 'labor')
  assert.equal(context.last_strategy_type, 'practical_steps')
  assert.deepEqual(context.last_source_titles, ['Трудовой кодекс Республики Казахстан'])
  assert.equal(context.confidence, 'high')
})

test('drops unsafe raw context values', () => {
  const context = normalizeAssistantConversationContext({
    last_domain: 'labor',
    last_source_titles: ['raw qdrant payload', 'Трудовой кодекс Республики Казахстан'],
    last_source_urls: ['raw html', 'https://adilet.zan.kz/rus/docs/K1500000414'],
    confidence: 'high'
  })

  assert.deepEqual(context.last_source_titles, ['Трудовой кодекс Республики Казахстан'])
  assert.deepEqual(context.last_source_urls, ['https://adilet.zan.kz/rus/docs/K1500000414'])
})

test('gets latest assistant context from messages', () => {
  const context = getLatestAssistantConversationContext([
    { role: 'assistant', status: 'sent', metadata: { assistantConversationContext: { last_domain: 'child_rights' } } },
    { role: 'user', status: 'sent', content: 'а сроки?' },
    { role: 'assistant', status: 'loading', metadata: { assistantConversationContext: { last_domain: 'labor' } } }
  ])

  assert.equal(context.last_domain, 'child_rights')
})

test('returns null without compact context', () => {
  assert.equal(normalizeAssistantConversationContext({ raw_payload: 'secret' }), null)
})

