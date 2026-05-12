import assert from 'node:assert/strict'
import { test } from 'node:test'

import { getChatRouteForMessage } from './chatRouting.js'

test('legal query routes to legal stream when SSE is enabled', () => {
  assert.equal(
    getChatRouteForMessage('Найди нормы Строительного кодекса РК 2026 про строительство', {
      sseEnabled: true,
      canPatch: true,
      hasToken: false
    }),
    'legal_stream'
  )
})

test('legal query falls back to legal deep when stream is disabled', () => {
  assert.equal(
    getChatRouteForMessage('Найди статью кодекса', {
      sseEnabled: false,
      canPatch: true,
      hasToken: true
    }),
    'legal_deep'
  )
})

test('capability question routes to legal endpoint', () => {
  assert.equal(
    getChatRouteForMessage('ты подключен к адилету?', {
      sseEnabled: true,
      canPatch: true
    }),
    'legal_stream'
  )
})

test('obvious NPA practical prompt routes to legal endpoint before chat', () => {
  assert.equal(
    getChatRouteForMessage('Школа не принимает жалобу по ребенку. Что делать?', {
      sseEnabled: true,
      canPatch: true,
      hasToken: false
    }),
    'legal_stream'
  )
  assert.equal(
    getChatRouteForMessage('Коллекторы звонят моим родственникам и угрожают', {
      sseEnabled: true,
      canPatch: true,
      hasToken: false
    }),
    'legal_stream'
  )
  assert.equal(
    getChatRouteForMessage('Застройщик задерживает сдачу квартиры по долевому участию', {
      sseEnabled: false,
      canPatch: true,
      hasToken: false
    }),
    'legal_deep'
  )
  assert.equal(
    getChatRouteForMessage('Судебный исполнитель арестовал банковский счет', {
      sseEnabled: true,
      canPatch: true,
      hasToken: false
    }),
    'legal_stream'
  )
  assert.equal(
    getChatRouteForMessage('Мне отказали в социальной выплате через госуслугу', {
      sseEnabled: true,
      canPatch: true,
      hasToken: false
    }),
    'legal_stream'
  )
  assert.equal(
    getChatRouteForMessage('Акимат не отвечает на обращение', {
      sseEnabled: true,
      canPatch: true,
      hasToken: false
    }),
    'legal_stream'
  )
  assert.equal(
    getChatRouteForMessage('ИП на упрощенке пропустил срок формы 910', {
      sseEnabled: true,
      canPatch: true,
      hasToken: false
    }),
    'legal_stream'
  )
  assert.equal(
    getChatRouteForMessage('ИП форма 910 просрочил', {
      sseEnabled: true,
      canPatch: true,
      hasToken: false
    }),
    'legal_stream'
  )
})

test('non-legal query keeps old chat routes', () => {
  assert.equal(
    getChatRouteForMessage('Привет, помоги с планом на день', {
      sseEnabled: true,
      canPatch: true,
      hasToken: true
    }),
    'chat_stream'
  )
  assert.equal(
    getChatRouteForMessage('Привет, помоги с планом на день', {
      sseEnabled: false,
      canPatch: true,
      hasToken: true
    }),
    'chat'
  )
  assert.equal(
    getChatRouteForMessage('напиши короткое поздравление другу', {
      sseEnabled: true,
      canPatch: true,
      hasToken: true
    }),
    'chat_stream'
  )
})
