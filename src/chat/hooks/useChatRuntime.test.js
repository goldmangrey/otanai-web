import assert from 'node:assert/strict'
import { test } from 'node:test'

import { getChatErrorMessage, shouldRetryLegalDeepAfterStreamFailure } from './useChatRuntime.js'

test('legal stream failure retries deep unless aborted', () => {
  assert.equal(shouldRetryLegalDeepAfterStreamFailure(new Error('Failed to fetch')), true)
  assert.equal(shouldRetryLegalDeepAfterStreamFailure({ name: 'AbortError' }), false)
})

test('legal route failure uses safe legal error instead of generic chat fallback text', () => {
  assert.equal(
    getChatErrorMessage(new Error('The legal research request failed.'), { legalRoute: true }),
    'Не удалось получить юридический ответ сейчас. Повторите запрос позже.'
  )
  assert.equal(
    getChatErrorMessage(new Error('The assistant request failed.'), { legalRoute: false }),
    'The assistant request failed.'
  )
})
