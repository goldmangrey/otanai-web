function asArray(value) {
  return Array.isArray(value) ? value : []
}

function cleanString(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function dedupeBy(items, keyFn) {
  const seen = new Set()
  const output = []

  for (const item of items) {
    if (!item || typeof item !== 'object') continue
    const key = keyFn(item)
    if (!key || seen.has(key)) continue
    seen.add(key)
    output.push(item)
  }

  return output
}

function sourceKey(source) {
  return cleanString(source.url || source.origin_url || source.originUrl || source.source_id || source.sourceId || source.id || `${source.domain}:${source.title}`)
    .toLowerCase()
}

function activityKey(item) {
  return cleanString(item.id || `${item.phase || item.type}:${item.label}:${item.detail}`).toLowerCase()
}

export function mergeLiveSources(existing = [], incoming = []) {
  return dedupeBy([...asArray(existing), ...asArray(incoming)], sourceKey)
}

export function mergeLiveActivity(existing = [], incoming = []) {
  return dedupeBy([...asArray(existing), ...asArray(incoming)], activityKey).slice(0, 20)
}

export function mergeLiveMetadata(currentMetadata = null, patch = {}) {
  const current = currentMetadata && typeof currentMetadata === 'object' ? currentMetadata : {}
  const next = patch && typeof patch === 'object' ? patch : {}
  const merged = {
    ...current,
    ...next
  }

  if (current.sources || next.sources) {
    merged.sources = mergeLiveSources(current.sources, next.sources)
  }

  if (current.citations || next.citations) {
    merged.citations = mergeLiveSources(current.citations, next.citations)
  }

  if (current.activity || next.activity) {
    merged.activity = mergeLiveActivity(current.activity, next.activity)
  }

  if (current.blocks || next.blocks) {
    merged.blocks = asArray(next.blocks).length ? next.blocks : asArray(current.blocks)
  }

  if (current.quality || next.quality) {
    merged.quality = {
      ...(current.quality && typeof current.quality === 'object' ? current.quality : {}),
      ...(next.quality && typeof next.quality === 'object' ? next.quality : {})
    }
  }

  return Object.keys(merged).length ? merged : null
}
