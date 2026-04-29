export function createRequestId() {
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
