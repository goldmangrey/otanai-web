import assert from 'node:assert/strict'
import test from 'node:test'

import { APP_STORE_URL } from './appStore.js'

test('App Store URL points to the OtanAI listing', () => {
  assert.equal(APP_STORE_URL, 'https://apps.apple.com/kz/app/otanai/id6756788077')
})
