import assert from 'node:assert/strict'
import test from 'node:test'

import {
  AUTH_BENEFIT_MODAL_DISMISSED_KEY,
  dismissAuthBenefitModal,
  hasDismissedAuthBenefitModal,
  shouldShowAuthBenefitModal
} from './authBenefitModal.js'

function memoryStorage() {
  const values = new Map()
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value))
  }
}

test('auth benefit modal appears only for undismissed guests after auth loads', () => {
  assert.equal(
    shouldShowAuthBenefitModal({
      authLoading: false,
      isAuthenticated: false,
      dismissed: false
    }),
    true
  )
  assert.equal(
    shouldShowAuthBenefitModal({
      authLoading: true,
      isAuthenticated: false,
      dismissed: false
    }),
    false
  )
  assert.equal(
    shouldShowAuthBenefitModal({
      authLoading: false,
      isAuthenticated: true,
      dismissed: false
    }),
    false
  )
  assert.equal(
    shouldShowAuthBenefitModal({
      authLoading: false,
      isAuthenticated: false,
      dismissed: true
    }),
    false
  )
})

test('auth benefit modal dismissal persists to storage', () => {
  const storage = memoryStorage()
  assert.equal(hasDismissedAuthBenefitModal(storage), false)
  dismissAuthBenefitModal(storage)
  assert.equal(storage.getItem(AUTH_BENEFIT_MODAL_DISMISSED_KEY), 'true')
  assert.equal(hasDismissedAuthBenefitModal(storage), true)
})
