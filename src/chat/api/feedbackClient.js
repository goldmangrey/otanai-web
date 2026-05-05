export const FEEDBACK_REASONS = [
  { code: 'misunderstood_question', label: 'Не понял вопрос' },
  { code: 'too_verbose', label: 'Много воды' },
  { code: 'missing_steps', label: 'Мало конкретных шагов' },
  { code: 'missing_sources', label: 'Мало источников' },
  { code: 'bad_sources', label: 'Источники не подходят' },
  { code: 'outdated_or_uncertain', label: 'Ответ устаревший/сомнительный' },
  { code: 'needed_document', label: 'Нужен документ/шаблон' },
  { code: 'wrong_format', label: 'Неверный формат' },
  { code: 'too_short', label: 'Слишком коротко' },
  { code: 'incorrect_fact', label: 'Ошибка в фактах' },
  { code: 'other', label: 'Другое' }
]

function normalizeBaseUrl(apiBaseUrl) {
  const normalized = apiBaseUrl?.replace(/\/$/, '')
  if (!normalized) {
    throw new Error('Missing VITE_API_BASE_URL for feedback backend.')
  }
  return normalized
}

function getNestedValue(payload, path) {
  return path.split('.').reduce((value, key) => {
    if (!value || typeof value !== 'object') return null
    return value[key] ?? null
  }, payload)
}

function countOfficialSources(sources) {
  if (!Array.isArray(sources)) return 0
  return sources.filter((source) => {
    if (!source || typeof source !== 'object') return false
    return source.is_official === true || source.isOfficial === true || source.trust_level === 'high'
  }).length
}

export function buildFeedbackMetadataSnapshot(metadata) {
  const sources = Array.isArray(metadata?.sources) ? metadata.sources : []
  const activity = Array.isArray(metadata?.activity) ? metadata.activity : []

  return {
    domain: getNestedValue(metadata, 'intentUnderstanding.domain'),
    intent: getNestedValue(metadata, 'intentUnderstanding.intent'),
    answerType: getNestedValue(metadata, 'answerPlan.answer_type'),
    styleName: getNestedValue(metadata, 'responseStylePolicy.style_name'),
    qualityStatus: getNestedValue(metadata, 'quality.evidence_status'),
    sourceCount: sources.length,
    officialCount: countOfficialSources(sources),
    activityCount: activity.length,
    answerCritiquePassed: getNestedValue(metadata, 'answerCritique.passed')
  }
}

export async function hashAnswerText(text) {
  const normalized = String(text || '')
  if (!normalized || !globalThis.crypto?.subtle) return null
  const bytes = new TextEncoder().encode(normalized)
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

export async function submitAnswerFeedback({
  apiBaseUrl,
  token,
  chatId,
  message,
  rating,
  reasons = [],
  comment = null,
  signal
}) {
  const normalizedBaseUrl = normalizeBaseUrl(apiBaseUrl)
  if (!token) {
    throw new Error('Sign in is required to send feedback.')
  }
  const answerText = String(message?.content || '')
  const response = await fetch(`${normalizedBaseUrl}/v1/feedback/answer`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      chatId,
      messageId: message?.id,
      traceId: message?.metadata?.traceId || message?.requestId || message?.metadata?.requestId || null,
      rating,
      reasons,
      comment: comment || null,
      answerSnapshot: {
        textHash: await hashAnswerText(answerText),
        answerLength: answerText.length
      },
      metadataSnapshot: buildFeedbackMetadataSnapshot(message?.metadata || null)
    }),
    signal
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    throw new Error(data?.detail || data?.message || 'Feedback request failed.')
  }

  return data
}
