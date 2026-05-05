const SAFE_PROTOCOLS = new Set(['http:', 'https:'])

function hasControlCharacter(value) {
  return Array.from(value).some((char) => {
    const code = char.charCodeAt(0)
    return code <= 31 || code === 127
  })
}

export function safeUrl(value) {
  if (typeof value !== 'string') return null

  const trimmed = value.trim()
  if (hasControlCharacter(trimmed)) return null
  if (!trimmed || trimmed.startsWith('//')) return null

  if (/^mailto:/i.test(trimmed)) {
    return /^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(trimmed) ? trimmed : null
  }

  try {
    const parsed = new URL(trimmed)
    return SAFE_PROTOCOLS.has(parsed.protocol) ? trimmed : null
  } catch {
    return null
  }
}

export function safeExternalLinkProps(value) {
  const href = safeUrl(value)
  if (!href) return null

  return {
    href,
    target: '_blank',
    rel: 'noopener noreferrer'
  }
}
