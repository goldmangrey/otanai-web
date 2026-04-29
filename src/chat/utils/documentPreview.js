const DOCUMENT_LANGUAGES = new Set(['document', 'doc', 'template', 'legal'])

export function getCodeLanguage(className = '') {
  return String(className || '').replace('language-', '').trim().toLowerCase()
}

export function isDocumentLanguage(language = '') {
  return DOCUMENT_LANGUAGES.has(String(language || '').trim().toLowerCase())
}

export function isDocumentLike(content, language = '') {
  const text = String(content || '')
  if (isDocumentLanguage(language)) return true

  const hasDocumentTitle = /(заявление|жалоба|шаблон|договор|обращение)/i.test(text)
  const placeholderCount = (text.match(/\[[^\]\n]{2,48}\]/g) || []).length
  const fieldCount = (text.match(/^(кому|от|иин|телефон|дата|подпись|адресат|заявитель|банк|договор):/gim) || []).length

  return hasDocumentTitle && (placeholderCount >= 2 || fieldCount >= 3)
}

export function isStandaloneDocument(markdown) {
  const text = String(markdown || '')
  if (/```[\s\S]*?```/.test(text)) return false
  return isDocumentLike(text) && text.split('\n').length >= 6
}

export function splitDocumentPlaceholders(line) {
  return String(line || '').split(/(\[[^\]\n]{2,48}\])/g)
}

export function isDocumentPlaceholder(part) {
  return /^\[[^\]\n]{2,48}\]$/.test(String(part || ''))
}
