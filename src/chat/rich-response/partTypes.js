export const PART_TYPES = {
  MARKDOWN: 'markdown',
  TABLE: 'table',
  DOCUMENT_PREVIEW: 'document_preview',
  LEGAL_CITATION: 'legal_citation',
  WARNING: 'warning',
  RISK: 'risk',
  CHECKLIST: 'checklist',
  TIMELINE: 'timeline',
  MISSING_INFO: 'missing_info',
  SUGGESTED_ACTIONS: 'suggested_actions',
  LEGAL_DISCLAIMER: 'legal_disclaimer',
  SOURCE_PANEL: 'source_panel',
  UNKNOWN: 'unknown'
}

const KNOWN_PART_TYPES = new Set(Object.values(PART_TYPES))
const PART_TYPE_ALIASES = {
  legal_basis: PART_TYPES.LEGAL_CITATION,
  citation: PART_TYPES.LEGAL_CITATION,
  callout: PART_TYPES.WARNING,
  alert: PART_TYPES.WARNING,
  risk_warning: PART_TYPES.RISK,
  next_steps: PART_TYPES.CHECKLIST,
  required_info: PART_TYPES.MISSING_INFO,
  actions: PART_TYPES.SUGGESTED_ACTIONS,
  disclaimer: PART_TYPES.LEGAL_DISCLAIMER,
  sources: PART_TYPES.SOURCE_PANEL,
  sourcepanel: PART_TYPES.SOURCE_PANEL,
  citations: PART_TYPES.SOURCE_PANEL,
  references: PART_TYPES.SOURCE_PANEL,
  legal_sources: PART_TYPES.SOURCE_PANEL
}

export function isKnownPartType(type) {
  return KNOWN_PART_TYPES.has(String(type || '').trim())
}

export function normalizePartType(type) {
  const normalized = String(type || '').trim().toLowerCase()
  if (PART_TYPE_ALIASES[normalized]) return PART_TYPE_ALIASES[normalized]
  return isKnownPartType(normalized) ? normalized : PART_TYPES.UNKNOWN
}
