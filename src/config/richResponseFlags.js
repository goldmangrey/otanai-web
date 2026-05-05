const TRUE_VALUE = 'true'
const FALSE_VALUE = 'false'

function readBooleanEnvFrom(env, name) {
  const value = env[name]
  if (value === TRUE_VALUE) return true
  if (value === FALSE_VALUE) return false
  return null
}

function readBooleanEnv(name) {
  return readBooleanEnvFrom(import.meta.env || {}, name)
}

export function resolveRichResponseFlags(env = {}) {
  const designExplicit = readBooleanEnvFrom(env, 'VITE_ENABLE_RICH_RESPONSE_DESIGN_MODE')
  const designMode = designExplicit !== null ? designExplicit : Boolean(env.DEV)

  function enabledWithDesign(envName, fallback = false) {
    const explicit = readBooleanEnvFrom(env, envName)
    if (explicit !== null) return explicit
    return designMode || fallback
  }

  return {
    designMode,
    richRenderer: enabledWithDesign('VITE_ENABLE_RICH_RENDERER'),
    streamProtocolV4: enabledWithDesign('VITE_ENABLE_STREAM_PROTOCOL_V4'),
    playground: enabledWithDesign('VITE_ENABLE_RICH_RESPONSE_PLAYGROUND', Boolean(env.DEV)),
    debugPanel: readBooleanEnvFrom(env, 'VITE_SHOW_RICH_RENDERER_DEBUG') === true,
    smoothReveal: enabledWithDesign('VITE_ENABLE_STREAM_SMOOTH_REVEAL'),
    inlineSources: readBooleanEnvFrom(env, 'VITE_RICH_RENDER_INLINE_SOURCES') === true,
    dev: Boolean(env.DEV)
  }
}

export function isRichDesignModeEnabled() {
  return resolveRichResponseFlags(import.meta.env || {}).designMode
}

function enabledWithDesignFallback(envName, fallback = false) {
  const explicit = readBooleanEnv(envName)
  if (explicit !== null) return explicit
  return isRichDesignModeEnabled() || fallback
}

export function isRichRendererEnabled() {
  return enabledWithDesignFallback('VITE_ENABLE_RICH_RENDERER')
}

export function isStreamProtocolV4Enabled() {
  return enabledWithDesignFallback('VITE_ENABLE_STREAM_PROTOCOL_V4')
}

export function isRichPlaygroundEnabled() {
  return enabledWithDesignFallback('VITE_ENABLE_RICH_RESPONSE_PLAYGROUND', Boolean((import.meta.env || {}).DEV))
}

export function shouldShowRichDebugPanel() {
  return readBooleanEnv('VITE_SHOW_RICH_RENDERER_DEBUG') === true
}

export function shouldRenderInlineSources() {
  return readBooleanEnv('VITE_RICH_RENDER_INLINE_SOURCES') === true
}

export function isStreamSmoothRevealEnabled() {
  return enabledWithDesignFallback('VITE_ENABLE_STREAM_SMOOTH_REVEAL')
}

export function getRichResponseFlags() {
  return resolveRichResponseFlags(import.meta.env || {})
}
