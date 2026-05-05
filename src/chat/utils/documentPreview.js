const DOCUMENT_LANGUAGES = new Set(['document', 'doc', 'template'])

export function getCodeLanguage(className = '') {
  return String(className || '').replace('language-', '').trim().toLowerCase()
}

export function isDocumentLanguage(language = '') {
  return DOCUMENT_LANGUAGES.has(String(language || '').trim().toLowerCase())
}

export function documentPreviewAllowed(artifactIntent = null) {
  const artifact = artifactIntent?.artifactIntent || artifactIntent?.artifact_intent || artifactIntent
  if (artifact?.document_forbidden === true || artifact?.documentForbidden === true) return false
  if (!(artifact?.document_preview_allowed === true || artifact?.documentPreviewAllowed === true)) return false

  const answerPlan = artifactIntent?.answerPlan || artifactIntent?.answer_plan || null
  const stylePolicy = artifactIntent?.responseStylePolicy || artifactIntent?.response_style_policy || null
  if (!answerPlan && !stylePolicy && !artifactIntent?.artifactIntent && !artifactIntent?.artifact_intent) return true

  const answerType = answerPlan?.answer_type || answerPlan?.answerType
  const markdownPolicy = stylePolicy?.markdown_policy || stylePolicy?.markdownPolicy || {}
  return answerType === 'document_template' && markdownPolicy?.use_document_block === true
}

export function hasStrongDocumentStructure(content) {
  const text = String(content || '')
  const placeholderCount = (text.match(/\[[^\]\n]{2,48}\]/g) || []).length
  const fieldCount = (text.match(/^(кому|от|иин|телефон|дата|подпись|адресат|заявитель|банк|договор):/gim) || []).length
  const hasFormalTitle = /^(заявление|жалоба|шаблон|договор|обращение|претензия|уведомление|расписка|доверенность|исковое заявление)$/im.test(text)
  const hasSignature = /^(дата|подпись):/im.test(text)

  return hasFormalTitle && (placeholderCount >= 2 || fieldCount >= 3 || (fieldCount >= 2 && hasSignature))
}

export function shouldRenderDocumentPreview(content, language = '', artifactIntent = null) {
  const normalizedLanguage = String(language || '').trim().toLowerCase()
  if (!isDocumentLanguage(normalizedLanguage)) return false
  if (documentPreviewAllowed(artifactIntent)) return true
  if (artifactIntent) return false
  return false
}

export function isDocumentLike(content, language = '', artifactIntent = null) {
  const text = String(content || '')
  if (isDocumentLanguage(language)) return shouldRenderDocumentPreview(text, language, artifactIntent)

  const hasDocumentTitle = /(заявление|жалоба|шаблон|договор|обращение)/i.test(text)
  const placeholderCount = (text.match(/\[[^\]\n]{2,48}\]/g) || []).length
  const fieldCount = (text.match(/^(кому|от|иин|телефон|дата|подпись|адресат|заявитель|банк|договор):/gim) || []).length

  return documentPreviewAllowed(artifactIntent) && hasDocumentTitle && (placeholderCount >= 2 || fieldCount >= 3)
}

export function isStandaloneDocument(markdown, artifactIntent = null) {
  const text = String(markdown || '')
  if (!documentPreviewAllowed(artifactIntent)) return false
  if (/```[\s\S]*?```/.test(text)) return false
  return hasStrongDocumentStructure(text) && isDocumentLike(text, '', artifactIntent) && text.split('\n').length >= 6
}

export function splitDocumentPlaceholders(line) {
  return String(line || '').split(/(\[[^\]\n]{2,48}\])/g)
}

export function isDocumentPlaceholder(part) {
  return /^\[[^\]\n]{2,48}\]$/.test(String(part || ''))
}
