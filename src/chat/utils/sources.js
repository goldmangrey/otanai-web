const OFFICIAL_KZ_DOMAINS = new Set([
  'adilet.zan.kz',
  'egov.kz',
  'gov.kz',
  'kgd.gov.kz',
  'portal.kgd.gov.kz',
  'nationalbank.kz',
  'khc.kz',
  'elicense.kz',
  'eotinish.kz',
  'enpf.kz',
  'sud.gov.kz',
  'office.sud.kz',
  'stat.gov.kz'
])

const OFFICIAL_SOURCE_TYPES = new Set([
  'official_portal',
  'law',
  'regulator',
  'government',
  'official_bank'
])

const TRUST_LEVELS = new Set(['high', 'medium', 'low'])
const SNIPPET_MAX_CHARS = 300

function readString(...values) {
  for (const value of values) {
    if (value === null || value === undefined) continue
    const trimmed = String(value).trim()
    if (trimmed) return trimmed
  }
  return ''
}

function trimSnippet(value) {
  const text = readString(value).replace(/\s+/g, ' ')
  if (text.length <= SNIPPET_MAX_CHARS) return text
  return `${text.slice(0, SNIPPET_MAX_CHARS).trim()}...`
}

export function getDomainFromUrl(url) {
  const raw = readString(url)
  if (!raw) return ''

  try {
    const parsed = new URL(raw)
    return parsed.hostname.toLowerCase().replace(/^www\./, '')
  } catch {
    return ''
  }
}

export function isOfficialKzSource(domain, sourceType = '') {
  const normalizedDomain = readString(domain).toLowerCase().replace(/^www\./, '')
  const normalizedType = readString(sourceType).toLowerCase()

  if (OFFICIAL_SOURCE_TYPES.has(normalizedType)) return true
  if (OFFICIAL_KZ_DOMAINS.has(normalizedDomain)) return true

  return Array.from(OFFICIAL_KZ_DOMAINS).some((officialDomain) =>
    normalizedDomain.endsWith(`.${officialDomain}`)
  )
}

function normalizeTrustLevel(value) {
  const normalized = readString(value).toLowerCase()
  return TRUST_LEVELS.has(normalized) ? normalized : 'unknown'
}

function collectSourceCandidates(input) {
  if (!input) return []
  if (Array.isArray(input)) return input

  const metadata = input.metadata && typeof input.metadata === 'object' ? input.metadata : input
  const candidates = [
    metadata.sources,
    metadata.citations,
    metadata.evidence,
    input.sources,
    input.citations
  ]

  return candidates.find((candidate) => Array.isArray(candidate)) || []
}

function normalizeSource(item, index) {
  if (!item || typeof item !== 'object') return null

  const url = readString(item.url, item.origin_url, item.originUrl, item.href, item.link)
  const domain = readString(item.domain, getDomainFromUrl(url))
  const sourceId = readString(item.source_id, item.sourceId, item.id)
  const sourceType = readString(item.source_type, item.sourceType, item.type, 'unknown')
  const trustLevel = normalizeTrustLevel(item.trust_level || item.trustLevel || item.tier)
  const title = readString(item.title, item.name, sourceId, domain, 'Источник')
  const snippet = trimSnippet(item.snippet || item.excerpt || item.description || item.text)
  const isOfficial =
    Boolean(item.is_official || item.isOfficial) || isOfficialKzSource(domain, sourceType)

  return {
    id: readString(item.id, sourceId, url, title, `source_${index + 1}`),
    source_id: sourceId,
    title,
    domain,
    url,
    snippet,
    trust_level: trustLevel,
    source_type: sourceType,
    version_date: readString(item.version_date, item.versionDate),
    is_official: isOfficial
  }
}

export function normalizeSources(input) {
  const normalized = []
  const seen = new Set()

  collectSourceCandidates(input).forEach((item, index) => {
    const source = normalizeSource(item, index)
    if (!source) return

    const dedupeKey = source.url || source.source_id || source.title
    const normalizedKey = dedupeKey.toLowerCase()
    if (seen.has(normalizedKey)) return
    seen.add(normalizedKey)
    normalized.push(source)
  })

  return normalized
}
