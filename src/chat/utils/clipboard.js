function fallbackCopyText(text) {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'absolute'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
}

export async function copyText(text) {
  if (!text) return false

  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return true
  }

  fallbackCopyText(text)
  return true
}
