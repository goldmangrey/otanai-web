import test from 'node:test'
import assert from 'node:assert/strict'

import {
  canonicalFreshness,
  canonicalSourceStatus,
  canonicalSourceType,
  dedupeSources,
  metadataToSourcePanelPart,
  normalizeSource,
  normalizeSourcePanelPart,
  normalizeSources,
  sourceFreshnessLabel,
  sourceStatusLabel,
  sourceTypeLabel,
  valueToText
} from './sourceUtils.js'

test('normalizeSources supports arrays, null and primitive fallback', () => {
  assert.equal(normalizeSources(null).length, 0)
  assert.equal(normalizeSources(undefined).length, 0)
  assert.equal(normalizeSources(['Plain source'])[0].title, 'Plain source')
  assert.equal(normalizeSources([{ title: 'A' }])[0].title, 'A')
})

test('normalizeSources supports single object source and nested source panel', () => {
  assert.equal(normalizeSources({ title: 'Single', url: 'https://example.com' })[0].title, 'Single')
  assert.equal(normalizeSources({ source_panel: { sources: [{ title: 'Nested' }] } })[0].title, 'Nested')
})

test('normalizeSources supports metadata sources and citations', () => {
  assert.equal(normalizeSources({ metadata: { sources: [{ title: 'Source' }] } })[0].title, 'Source')
  assert.equal(normalizeSources({ metadata: { citations: [{ title: 'Citation' }] } })[0].title, 'Citation')
})

test('normalizeSource maps title url excerpt metadata and unsafe urls', () => {
  const source = normalizeSource({
    name: 'ГК РК',
    href: 'https://adilet.zan.kz',
    snippet: 'Статья 9',
    article: 'Статья 9',
    code: 'ГК РК',
    section: 'Защита',
    jurisdiction: 'Казахстан',
    status: 'active',
    freshness: 'checked',
    used_for: 'Правовое основание',
    confidence: 0.92
  })

  assert.equal(source.title, 'ГК РК')
  assert.equal(source.url, 'https://adilet.zan.kz')
  assert.equal(source.excerpt, 'Статья 9')
  assert.equal(source.article, 'Статья 9')
  assert.equal(source.status, 'active')
  assert.equal(source.freshness, 'checked')
  assert.equal(source.usedFor, 'Правовое основание')
  assert.equal(source.score, 0.92)

  assert.equal(normalizeSource({ title: 'Bad', url: 'javascript:alert(1)' }).url, null)
})

test('dedupeSources removes duplicate url title article and excerpt preserving order', () => {
  const sources = dedupeSources([
    normalizeSource({ title: 'A', url: 'https://example.com/a' }),
    normalizeSource({ title: 'A copy', url: 'https://example.com/a' }),
    normalizeSource({ title: 'B', article: '9' }),
    normalizeSource({ title: 'B', article: '9', excerpt: 'different' }),
    normalizeSource({ title: 'C', excerpt: 'same' }),
    normalizeSource({ title: 'C', excerpt: 'same' })
  ])

  assert.deepEqual(sources.map((source) => source.title), ['A', 'B', 'C'])
})

test('canonical source types and labels', () => {
  assert.equal(canonicalSourceType('legal'), 'law')
  assert.equal(canonicalSourceType('npa'), 'law')
  assert.equal(canonicalSourceType('decision'), 'case')
  assert.equal(canonicalSourceType('uploaded_document'), 'document')
  assert.equal(canonicalSourceType('web'), 'website')
  assert.equal(canonicalSourceType('registry'), 'registry')
  assert.equal(canonicalSourceType('other'), 'unknown')
  assert.equal(sourceTypeLabel('law'), 'НПА')
})

test('canonical statuses freshness and labels', () => {
  assert.equal(canonicalSourceStatus('active'), 'active')
  assert.equal(canonicalSourceStatus('outdated'), 'outdated')
  assert.equal(canonicalSourceStatus('archived'), 'archived')
  assert.equal(canonicalFreshness('checked'), 'checked')
  assert.equal(canonicalFreshness('stale'), 'stale')
  assert.equal(sourceStatusLabel('active'), 'Актуально')
  assert.equal(sourceFreshnessLabel('checked'), 'Проверено')
})

test('normalizeSourcePanelPart and metadataToSourcePanelPart are safe', () => {
  const panel = normalizeSourcePanelPart({
    type: 'source_panel',
    title: 'Источники',
    sources: [{ title: 'A' }]
  })
  assert.equal(panel.type, 'source_panel')
  assert.equal(panel.sources.length, 1)

  const fromMetadata = metadataToSourcePanelPart({
    blocks: [{ type: 'sources', sources: [{ title: 'Block source' }] }]
  })
  assert.equal(fromMetadata.type, 'source_panel')
  assert.equal(fromMetadata.sources[0].title, 'Block source')

  assert.equal(metadataToSourcePanelPart({ sources: [] }), null)
})

test('valueToText uses readable object fields and JSON fallback', () => {
  assert.equal(valueToText({ title: 'Title' }), 'Title')
  assert.equal(valueToText({ value: 'Value' }), 'Value')
  assert.equal(valueToText({ code: 'A1' }), '{"code":"A1"}')
})
