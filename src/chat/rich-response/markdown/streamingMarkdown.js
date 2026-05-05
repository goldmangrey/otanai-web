const CODE_FENCE_RE = /(^|\n)```/g

export function hasUnclosedCodeFence(text) {
  const value = String(text || '')
  const matches = value.match(CODE_FENCE_RE)
  return Boolean(matches && matches.length % 2 === 1)
}

export function normalizeStreamingMarkdown(text) {
  const value = String(text || '')
  if (!hasUnclosedCodeFence(value)) return value
  return `${value}${value.endsWith('\n') ? '' : '\n'}\n\`\`\``
}

export function prepareMarkdownForRender(text, { isStreaming = false } = {}) {
  const value = String(text || '')
  if (!isStreaming) return value
  return normalizeStreamingMarkdown(value)
}
