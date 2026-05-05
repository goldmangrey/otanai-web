import assert from 'node:assert/strict'
import test from 'node:test'

import { safeExternalLinkProps, safeUrl } from './safeUrl.js'

test('safeUrl accepts http https and mailto urls', () => {
  assert.equal(safeUrl('https://example.com'), 'https://example.com')
  assert.equal(safeUrl('http://example.com'), 'http://example.com')
  assert.equal(safeUrl('mailto:test@example.com'), 'mailto:test@example.com')
})

test('safeUrl trims safe urls', () => {
  assert.equal(safeUrl('  https://example.com/a  '), 'https://example.com/a')
})

test('safeUrl rejects unsafe schemes and empty values', () => {
  assert.equal(safeUrl('javascript:alert(1)'), null)
  assert.equal(safeUrl('data:text/html,<script>alert(1)</script>'), null)
  assert.equal(safeUrl('vbscript:msgbox(1)'), null)
  assert.equal(safeUrl('file:///etc/passwd'), null)
  assert.equal(safeUrl('blob:https://example.com/id'), null)
  assert.equal(safeUrl('about:blank'), null)
  assert.equal(safeUrl(''), null)
  assert.equal(safeUrl('   '), null)
  assert.equal(safeUrl('//evil.com'), null)
})

test('safeUrl rejects whitespace and control character obfuscation', () => {
  assert.equal(safeUrl(' javascript:alert(1)'), null)
  assert.equal(safeUrl('java\nscript:alert(1)'), null)
  assert.equal(safeUrl('https://example.com/\npath'), null)
  assert.equal(safeUrl('data:text/html,<script>alert(1)</script>'), null)
})

test('safeUrl rejects malformed or non-string values', () => {
  assert.equal(safeUrl('/relative/path'), null)
  assert.equal(safeUrl(null), null)
  assert.equal(safeUrl({ href: 'https://example.com' }), null)
})

test('safeExternalLinkProps returns hardened link props', () => {
  assert.deepEqual(safeExternalLinkProps('https://example.com'), {
    href: 'https://example.com',
    target: '_blank',
    rel: 'noopener noreferrer'
  })
  assert.equal(safeExternalLinkProps('javascript:alert(1)'), null)
})
