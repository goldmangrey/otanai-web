// Path: src/utils/support.js
export const CLIENT_ID_KEY = 'otanai_client_id'
export const ADMIN_ACCESS_KEY = 'otanai_admin_access'

export function getOrCreateClientId() {
  if (typeof window === 'undefined') return ''
  const existing = localStorage.getItem(CLIENT_ID_KEY)
  if (existing) return existing

  const generated =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `client_${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`

  localStorage.setItem(CLIENT_ID_KEY, generated)
  return generated
}

export function setAdminAccess(enabled) {
  if (typeof window === 'undefined') return
  localStorage.setItem(ADMIN_ACCESS_KEY, enabled ? 'true' : 'false')
}

export function hasAdminAccess() {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(ADMIN_ACCESS_KEY) === 'true'
}
