import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getRichResponseFlags,
  isRichDesignModeEnabled,
  isRichRendererEnabled,
  isRichPlaygroundEnabled,
  isStreamProtocolV4Enabled,
  shouldRenderInlineSources,
  shouldShowRichDebugPanel,
  isStreamSmoothRevealEnabled,
  resolveRichResponseFlags
} from './richResponseFlags.js'

test('rich response flags are safe without Vite env', () => {
  assert.equal(isRichDesignModeEnabled(), false)
  assert.equal(isRichRendererEnabled(), false)
  assert.equal(isStreamProtocolV4Enabled(), false)
  assert.equal(isRichPlaygroundEnabled(), false)
  assert.equal(shouldShowRichDebugPanel(), false)
  assert.equal(shouldRenderInlineSources(), false)
  assert.equal(isStreamSmoothRevealEnabled(), false)
})

test('design mode enables renderer v4 playground and reveal but not inline sources/debug by default', () => {
  const flags = resolveRichResponseFlags({
    VITE_ENABLE_RICH_RESPONSE_DESIGN_MODE: 'true'
  })

  assert.equal(flags.richRenderer, true)
  assert.equal(flags.streamProtocolV4, true)
  assert.equal(flags.playground, true)
  assert.equal(flags.smoothReveal, true)
  assert.equal(flags.debugPanel, false)
  assert.equal(flags.inlineSources, false)
})

test('inline sources and debug are explicit-only flags', () => {
  const flags = resolveRichResponseFlags({
    VITE_ENABLE_RICH_RESPONSE_DESIGN_MODE: 'true',
    VITE_RICH_RENDER_INLINE_SOURCES: 'true',
    VITE_SHOW_RICH_RENDERER_DEBUG: 'true'
  })

  assert.equal(flags.inlineSources, true)
  assert.equal(flags.debugPanel, true)
})

test('getRichResponseFlags returns a stable summary without secrets', () => {
  const flags = getRichResponseFlags()

  assert.deepEqual(Object.keys(flags).sort(), [
    'debugPanel',
    'designMode',
    'dev',
    'inlineSources',
    'playground',
    'richRenderer',
    'smoothReveal',
    'streamProtocolV4'
  ].sort())
})
