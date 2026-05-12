import { isLegalResearchQuery } from './legalIntent.js'

export function getChatRouteForMessage(message, { sseEnabled = false, canPatch = false, hasToken = false } = {}) {
  if (isLegalResearchQuery(message)) {
    return sseEnabled && canPatch ? 'legal_stream' : 'legal_deep'
  }
  return sseEnabled && canPatch && hasToken ? 'chat_stream' : 'chat'
}
