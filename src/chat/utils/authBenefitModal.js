export const AUTH_BENEFIT_MODAL_DISMISSED_KEY = 'otanai_auth_benefit_modal_dismissed'

export function hasDismissedAuthBenefitModal(storage = globalThis.localStorage) {
  try {
    return storage?.getItem(AUTH_BENEFIT_MODAL_DISMISSED_KEY) === 'true'
  } catch {
    return false
  }
}

export function dismissAuthBenefitModal(storage = globalThis.localStorage) {
  try {
    storage?.setItem(AUTH_BENEFIT_MODAL_DISMISSED_KEY, 'true')
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}

export function shouldShowAuthBenefitModal({
  authLoading,
  isAuthenticated,
  dismissed
}) {
  return !authLoading && !isAuthenticated && !dismissed
}
