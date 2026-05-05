import assert from 'node:assert/strict'
import test from 'node:test'

import {
  hasUnclosedCodeFence,
  normalizeStreamingMarkdown,
  prepareMarkdownForRender
} from './streamingMarkdown.js'

test('hasUnclosedCodeFence detects odd code fence count', () => {
  assert.equal(hasUnclosedCodeFence('Before\n```js\nconst x = 1'), true)
  assert.equal(hasUnclosedCodeFence('Before\n```js\nconst x = 1\n```'), false)
})

test('prepareMarkdownForRender leaves final markdown unchanged', () => {
  const input = 'Before\n```js\nconst x = 1'
  assert.equal(prepareMarkdownForRender(input, { isStreaming: false }), input)
})

test('prepareMarkdownForRender closes open code fence while streaming', () => {
  const input = 'Before\n```js\nconst x = 1'
  assert.equal(prepareMarkdownForRender(input, { isStreaming: true }), 'Before\n```js\nconst x = 1\n\n```')
})

test('prepareMarkdownForRender keeps partial table text safe while streaming', () => {
  const input = '| A | B |\n|---'
  assert.equal(prepareMarkdownForRender(input, { isStreaming: true }), input)
})

test('normalizeStreamingMarkdown does not alter closed fences', () => {
  const input = 'Before\n```js\nconst x = 1\n```'
  assert.equal(normalizeStreamingMarkdown(input), input)
})

test('prepareMarkdownForRender handles empty values safely', () => {
  assert.equal(prepareMarkdownForRender(null, { isStreaming: true }), '')
  assert.equal(prepareMarkdownForRender(undefined), '')
})
